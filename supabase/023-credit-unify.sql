-- ==========================================================================
-- 023 — 무료 정책 v4: "하루 한 편" 을 크레딧 하나로 합친다
--
-- 배경
--   v3 는 두 개념이 따로 돌았다: dailyFree(불리언) + balance(획득 크레딧).
--   그래서 화면 문구가 네 갈래로 갈라졌다.
--     "오늘 무료 한 편 남았습니다" / "오늘 무료 한 편 · 크레딧 2"
--     "크레딧 2개로 더 보실 수 있습니다" / "오늘 몫을 다 읽으셨습니다"
--   사용자가 "지금 뭘 볼 수 있는지" 를 한눈에 못 읽는다.
--
-- v4
--   통화는 크레딧 하나뿐이다. 자정(KST)에 잔액을 1까지 채워준다(top-up).
--   풀이 한 편 = 크레딧 1. 화면은 N/1 로만 보여준다.
--
--   · 잔액 0 에서 자정 → 1 로 채움
--   · 잔액 3(보너스 보유) 에서 자정 → 그대로 3. 쌓이지 않는다
--     (매일 +1 이면 안 보고 묵혀서 30개를 만들 수 있다. 킬스위치 비용 모델이 깨진다)
--   · 이미 본 풀이 재열람은 여전히 무료 (LLM 호출 자체가 없다)
--
-- 연속 사용 보상(7일 → +1)은 그대로 유지한다.
--
-- 멱등. SQL Editor 에 통째로 붙여넣어 실행할 수 있다.
-- ==========================================================================

-- ── 일일 충전 ────────────────────────────────────────────────────────────
-- v3 의 saju_use_daily 를 대체한다. 차이:
--   use_daily : "오늘 무료분을 소비했다" 를 기록하고 free=true/false 를 돌려줬다
--   refill    : 잔액을 1까지 올려두기만 한다. 소비는 saju_consume_credit 이 한다
CREATE OR REPLACE FUNCTION saju_refill_daily(p_today DATE)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user    UUID := auth.uid();
  v_sdate   DATE;
  v_streak  INT;
  v_reward  BOOLEAN := false;
  v_balance INT;
  v_hit     INT;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  PERFORM saju_ensure_credit_row(v_user);

  -- 행을 먼저 잠가 동시 요청이 같은 날 두 번 충전하지 못하게 한다
  SELECT streak_last_date, streak_count, balance
    INTO v_sdate, v_streak, v_balance
    FROM saju_credits WHERE user_id = v_user FOR UPDATE;

  -- 오늘 아직 안 채웠으면 1까지 끌어올린다 (이미 1 이상이면 그대로)
  UPDATE saju_credits
     SET balance         = GREATEST(balance, 1),
         daily_last_date = p_today,
         free_used       = true,
         updated_at      = now()
   WHERE user_id = v_user
     AND (daily_last_date IS NULL OR daily_last_date < p_today);
  GET DIAGNOSTICS v_hit = ROW_COUNT;

  IF v_hit = 0 THEN
    -- 오늘 이미 충전됨 — 잔액만 돌려준다
    RETURN jsonb_build_object(
      'refilled', false, 'balance', COALESCE(v_balance, 0),
      'streak', COALESCE(v_streak, 0), 'reward', false);
  END IF;

  -- 연속 사용 (어제 봤으면 +1, 아니면 1부터). 7일이면 보너스 크레딧 +1
  IF v_sdate = p_today - 1 THEN v_streak := COALESCE(v_streak, 0) + 1; ELSE v_streak := 1; END IF;
  IF v_streak >= 7 THEN
    v_reward := true;
    v_streak := 0;
    UPDATE saju_credits SET balance = balance + 1 WHERE user_id = v_user;
    INSERT INTO saju_credit_events (user_id, delta, reason) VALUES (v_user, 1, 'daily_streak');
  END IF;

  UPDATE saju_credits
     SET streak_count = v_streak, streak_last_date = p_today
   WHERE user_id = v_user
  RETURNING balance INTO v_balance;

  RETURN jsonb_build_object(
    'refilled', true, 'balance', COALESCE(v_balance, 0),
    'streak', v_streak, 'reward', v_reward);
END $$;

REVOKE ALL ON FUNCTION saju_refill_daily(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION saju_refill_daily(DATE) TO authenticated, service_role;

COMMENT ON FUNCTION saju_refill_daily(DATE) IS
  'v4 일일 충전. 잔액을 1까지 top-up (쌓이지 않음). 소비는 saju_consume_credit.';

-- v3 함수는 남겨두되 더 이상 호출하지 않는다 (롤백 여지).
COMMENT ON FUNCTION saju_use_daily(DATE) IS
  'v3 잔재 — v4 에서는 saju_refill_daily + saju_consume_credit 이 대체. 호출하지 않음';


-- ── 기존 사용자 이관 ──────────────────────────────────────────────────────
-- v3 에서 "오늘 무료분이 남아 있던" 사람은 v4 기준으로 크레딧 1을 가진 상태다.
-- 그대로 두면 오늘 하루 볼 수 있던 한 편이 사라진다.
UPDATE saju_credits
   SET balance = GREATEST(balance, 1)
 WHERE daily_last_date IS NULL
    OR daily_last_date < (now() AT TIME ZONE 'Asia/Seoul')::date;
