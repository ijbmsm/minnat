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
