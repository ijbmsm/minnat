-- 019: 무료 정책 v3 — "하루 한 편" (2026-09-17 결정)
--
-- 바뀐 점: 계정당 1회(영구) → 로그인 계정은 타입 무관 하루 1편 무료, KST 자정 리셋.
--   · 다섯 편(命·日·緣·財·合)을 다 보려면 5일 기다리거나 크레딧을 쓴다.
--   · 이미 본 풀이 재열람은 무제한 무료 (saju_readings 에 있으면 LLM 호출 자체가 없다).
--   · 다시 풀이받기(refresh)는 항상 크레딧 소모.
--   · 크레딧 획득은 그대로 — 공유 가입 +1 / 궁합 초대 수락 +1(양쪽) / 7일 연속 +1.
--
-- 결제가 없는 구조라 "막다른 길"을 만들지 않는 것이 핵심이다. 하루만 기다리면 다시 열린다.

ALTER TABLE saju_credits
  ADD COLUMN IF NOT EXISTS daily_last_date DATE;

COMMENT ON COLUMN saju_credits.daily_last_date IS '마지막으로 일일 무료 1편을 쓴 날(KST)';
COMMENT ON COLUMN saju_credits.free_used       IS '첫 풀이 완료 여부 — 랜딩 문구용. v3 에서는 차감 기준이 아니다';
COMMENT ON COLUMN saju_credits.today_last_date IS 'v2 잔재(오늘의 사주 전용). v3 에서는 daily_last_date 가 대체';

-- 기존 사용자 이관: free_used 가 true 면 이미 한 편을 썼다는 뜻이지만,
-- 날짜 정보가 없으므로 오늘부터 새로 시작하게 둔다(NULL = 오늘 아직 안 씀).

-- ── 일일 무료 1편 사용 ────────────────────────────────────────────────────
-- 반환: { free, streak, reward }
--   free=false 면 오늘 몫을 이미 썼다 → 호출부가 크레딧 차감으로 넘어간다.
-- 연속 출석(streak)은 "일일 무료를 쓴 날" 기준이다. 7일 연속이면 크레딧 +1 후 0 으로 리셋.
CREATE OR REPLACE FUNCTION saju_use_daily(p_today DATE)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user   UUID := auth.uid();
  v_sdate  DATE;
  v_streak INT;
  v_reward BOOLEAN := false;
  v_hit    INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM saju_ensure_credit_row(v_user);

  -- 행을 먼저 잠가 동시 요청이 같은 날 두 번 통과하지 못하게 한다
  SELECT streak_last_date, streak_count INTO v_sdate, v_streak
    FROM saju_credits WHERE user_id = v_user FOR UPDATE;

  UPDATE saju_credits
     SET daily_last_date = p_today, free_used = true, updated_at = now()
   WHERE user_id = v_user
     AND (daily_last_date IS NULL OR daily_last_date < p_today);
  GET DIAGNOSTICS v_hit = ROW_COUNT;

  IF v_hit = 0 THEN
    RETURN jsonb_build_object('free', false, 'streak', COALESCE(v_streak, 0), 'reward', false);
  END IF;

  IF v_sdate = p_today - 1 THEN v_streak := COALESCE(v_streak, 0) + 1; ELSE v_streak := 1; END IF;
  IF v_streak >= 7 THEN
    v_reward := true;
    v_streak := 0;
    UPDATE saju_credits SET balance = balance + 1 WHERE user_id = v_user;
    INSERT INTO saju_credit_events (user_id, delta, reason) VALUES (v_user, 1, 'daily_streak');
  END IF;

  UPDATE saju_credits SET streak_count = v_streak, streak_last_date = p_today WHERE user_id = v_user;

  RETURN jsonb_build_object('free', true, 'streak', v_streak, 'reward', v_reward);
END $$;

REVOKE ALL ON FUNCTION saju_use_daily(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION saju_use_daily(DATE) TO authenticated, service_role;

-- v2 함수는 남겨두되 더 이상 호출하지 않는다 (롤백 여지).
COMMENT ON FUNCTION saju_use_free()          IS 'v2 잔재 — v3 에서는 saju_use_daily 가 대체. 호출하지 않음';
COMMENT ON FUNCTION saju_touch_today(DATE)   IS 'v2 잔재 — v3 에서는 saju_use_daily 가 대체. 호출하지 않음';
