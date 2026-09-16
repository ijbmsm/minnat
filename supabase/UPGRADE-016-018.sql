-- ============================================================================
-- 술자리 사주 v2 — 기존(데이터 있는) DB 용 증분 마이그레이션
-- 2026-09-16 · 016 + 017 + 018 을 순서대로 이어 붙인 파일. 이 파일 전체를 SQL Editor 에 붙여넣고 실행.
--
-- SETUP.sql 은 신규 프로젝트 전용이라 데이터가 있으면 사전 점검에서 중단된다(TRUNCATE 포함).
-- 이 파일은 TRUNCATE·DROP TABLE 이 없고 전부 IF NOT EXISTS / OR REPLACE / DROP IF EXISTS 라 재실행해도 안전하다.
-- ============================================================================

-- ---------- 016-saju-chart-snapshot.sql ----------
-- 016: 원국 스냅샷 + 공개 공유 컬럼 제한
-- 1) chart: 계산 당시의 FourPillars(연·월·일·시주, 대운, trace) 를 그대로 보관.
--    엔진이 바뀌어도 "내가 봤던 원국" 이 유지되고, 공개 공유가 출생정보 없이 렌더된다.
-- 2) engine_version: factsheet FACTSHEET_VERSION. 현재 엔진과 다르면 UI 가 배너를 띄운다.
-- 3) 공개 정책이 USING(true) 로 모든 컬럼을 anon 에 열고 있었다 → anon 은 안전 컬럼만.

ALTER TABLE saju_readings
  ADD COLUMN IF NOT EXISTS chart          JSONB,
  ADD COLUMN IF NOT EXISTS engine_version TEXT;

-- anon(공개 링크) 은 출생정보·고민을 볼 수 없다. 컬럼 단위 GRANT.
DROP POLICY IF EXISTS "saju_readings_public_select" ON saju_readings;
CREATE POLICY "saju_readings_public_select" ON saju_readings
  FOR SELECT TO anon
  USING (true);

REVOKE SELECT ON saju_readings FROM anon;
GRANT SELECT (id, type, chart, engine_version, ai_sections, day_stem, day_element, created_at)
  ON saju_readings TO anon;

-- ---------- 017-saju-credits.sql ----------
-- 017: 사주 크레딧 원장 (SAJU_PLAN_V2 P2-1)
-- 결정: 계정당 무료 1회(free_used) + 획득형 크레딧(balance). 결제 없음.
-- 日(오늘의 사주)은 매일 1회 무료 — today_last_date 로 판정. 7일 연속이면 +1 (streak_*).
-- Redis 일일 카운터는 휘발성이라 원장으로 부적합 → 여기로 이전.
-- 주의: 009-credit-events 는 정치 플랫폼 감경 테이블이다. 무관.

CREATE TABLE IF NOT EXISTS saju_credits (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance          INT  NOT NULL DEFAULT 0 CHECK (balance >= 0),
  free_used        BOOLEAN NOT NULL DEFAULT false,
  today_last_date  DATE,
  streak_count     INT  NOT NULL DEFAULT 0,
  streak_last_date DATE,
  signup_ip_hash   TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS saju_credit_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta      INT  NOT NULL,
  reason     TEXT NOT NULL CHECK (reason IN (
               'signup','share_signup','invite_accept','daily_streak','reading','refresh','refund','admin')),
  ref_id     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saju_credit_events_user ON saju_credit_events (user_id, created_at DESC);

-- 공유 링크 가입 추적. referred 1명당 1행. 보상은 피추천인의 첫 풀이 완료 시.
CREATE TABLE IF NOT EXISTS saju_referrals (
  referred_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_reading_id UUID,
  ip_hash          TEXT,
  rewarded         BOOLEAN NOT NULL DEFAULT false,
  reject_reason    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_saju_referrals_referrer ON saju_referrals (referrer_user_id);

ALTER TABLE saju_credits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_credit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE saju_referrals     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saju_credits_own_select" ON saju_credits;
CREATE POLICY "saju_credits_own_select" ON saju_credits
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saju_credit_events_own_select" ON saju_credit_events;
CREATE POLICY "saju_credit_events_own_select" ON saju_credit_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- referrals 는 사용자에게 열지 않는다 (service_role 전용). 정책 없음 = 접근 불가.

-- ── RPC (SECURITY DEFINER, 원자적) ──────────────────────────────────────────
-- 모든 쓰기는 RPC 로만. 클라이언트/서버 세션 클라이언트가 테이블을 직접 UPDATE 하지 않는다.

-- 행 보장
CREATE OR REPLACE FUNCTION saju_ensure_credit_row(p_user UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO saju_credits (user_id) VALUES (p_user) ON CONFLICT (user_id) DO NOTHING;
$$;

-- 무료 1회 사용 시도. true = 이번에 소진함, false = 이미 사용됨.
CREATE OR REPLACE FUNCTION saju_use_free()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_hit INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM saju_ensure_credit_row(v_user);
  UPDATE saju_credits SET free_used = true, updated_at = now()
   WHERE user_id = v_user AND free_used = false;
  GET DIAGNOSTICS v_hit = ROW_COUNT;
  IF v_hit = 1 THEN
    INSERT INTO saju_credit_events (user_id, delta, reason) VALUES (v_user, 0, 'signup');
  END IF;
  RETURN v_hit = 1;
END $$;

-- 크레딧 1 소모. {ok, balance}
CREATE OR REPLACE FUNCTION saju_consume_credit(p_reason TEXT, p_ref TEXT DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); v_bal INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM saju_ensure_credit_row(v_user);
  SELECT balance INTO v_bal FROM saju_credits WHERE user_id = v_user FOR UPDATE;
  IF v_bal <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'balance', 0);
  END IF;
  UPDATE saju_credits SET balance = balance - 1, updated_at = now() WHERE user_id = v_user;
  INSERT INTO saju_credit_events (user_id, delta, reason, ref_id) VALUES (v_user, -1, p_reason, p_ref);
  RETURN jsonb_build_object('ok', true, 'balance', v_bal - 1);
END $$;

-- 오늘의 사주 무료 판정 + 연속 출석. {free, streak, reward}
CREATE OR REPLACE FUNCTION saju_touch_today(p_today DATE)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user UUID := auth.uid(); r saju_credits%ROWTYPE; v_streak INT; v_reward BOOLEAN := false;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM saju_ensure_credit_row(v_user);
  SELECT * INTO r FROM saju_credits WHERE user_id = v_user FOR UPDATE;
  IF r.today_last_date = p_today THEN
    RETURN jsonb_build_object('free', false, 'streak', r.streak_count, 'reward', false);
  END IF;
  IF r.streak_last_date = p_today - 1 THEN v_streak := r.streak_count + 1; ELSE v_streak := 1; END IF;
  IF v_streak >= 7 THEN
    v_reward := true; v_streak := 0;
    UPDATE saju_credits SET balance = balance + 1 WHERE user_id = v_user;
    INSERT INTO saju_credit_events (user_id, delta, reason) VALUES (v_user, 1, 'daily_streak');
  END IF;
  UPDATE saju_credits
     SET today_last_date = p_today, streak_count = v_streak, streak_last_date = p_today, updated_at = now()
   WHERE user_id = v_user;
  RETURN jsonb_build_object('free', true, 'streak', v_streak, 'reward', v_reward);
END $$;

-- 지급 (service_role 전용). 사용자 세션에서 호출 불가.
CREATE OR REPLACE FUNCTION saju_grant_credit(p_user UUID, p_delta INT, p_reason TEXT, p_ref TEXT DEFAULT NULL)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bal INT;
BEGIN
  PERFORM saju_ensure_credit_row(p_user);
  UPDATE saju_credits SET balance = balance + p_delta, updated_at = now()
   WHERE user_id = p_user RETURNING balance INTO v_bal;
  INSERT INTO saju_credit_events (user_id, delta, reason, ref_id) VALUES (p_user, p_delta, p_reason, p_ref);
  RETURN v_bal;
END $$;

REVOKE ALL ON FUNCTION saju_ensure_credit_row(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION saju_grant_credit(UUID, INT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION saju_ensure_credit_row(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION saju_grant_credit(UUID, INT, TEXT, TEXT) TO service_role;
REVOKE ALL ON FUNCTION saju_use_free() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION saju_consume_credit(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION saju_touch_today(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION saju_use_free() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION saju_consume_credit(TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION saju_touch_today(DATE) TO authenticated, service_role;

-- ---------- 018-saju-invites.sql ----------
-- 018: 궁합 초대 링크 + 궁합 리딩 저장 (SAJU_PLAN_V2 P2-5, 결정 ③ 상대 출생정보 저장)

-- saju_readings.type 에 'compat' 추가 (011 의 인라인 CHECK 는 saju_readings_type_check 로 자동 명명됨)
ALTER TABLE saju_readings DROP CONSTRAINT IF EXISTS saju_readings_type_check;
ALTER TABLE saju_readings ADD CONSTRAINT saju_readings_type_check
  CHECK (type IN ('full', 'today', 'love', 'career', 'compat'));

-- 궁합 상대 (출생정보 + chart + 이름 선택). 본인 행에만 붙고 RLS 는 011 그대로 본인만.
ALTER TABLE saju_readings ADD COLUMN IF NOT EXISTS partner JSONB;

CREATE TABLE IF NOT EXISTS saju_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT NOT NULL UNIQUE,
  inviter_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 초대한 사람의 출생정보 + chart + name. 상대에게는 일주·오행·후킹 문장만 노출한다.
  person_a    JSONB NOT NULL,
  relation    TEXT NOT NULL DEFAULT 'lover' CHECK (relation IN ('lover','friend','coworker','family')),
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  invitee_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reading_id  UUID REFERENCES saju_readings(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_saju_invites_inviter ON saju_invites (inviter_id, created_at DESC);

ALTER TABLE saju_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saju_invites_inviter_select" ON saju_invites;
CREATE POLICY "saju_invites_inviter_select" ON saju_invites
  FOR SELECT TO authenticated USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);
-- 토큰 조회·수락은 service_role 경유 (API 라우트). anon 정책 없음.

DO $done$ BEGIN RAISE NOTICE '사주 v2 증분 마이그레이션 016·017·018 적용 완료'; END $done$;
