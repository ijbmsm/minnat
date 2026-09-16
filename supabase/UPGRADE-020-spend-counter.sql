-- 프로덕션(데이터 있는 DB)용 — 이 파일 전체를 SQL Editor 에 붙여넣어 실행하세요.
-- 020 만 담겨 있습니다. TRUNCATE·DROP 없음, 재실행 안전.

-- 020: 월 LLM 호출 카운터를 Postgres 로 (2026-09-17)
--
-- 이전에는 Upstash Redis 에 두었는데, 무료 DB 가 미사용으로 삭제되면서 지출 상한이
-- 통째로 사라졌다. Eviction 을 켜면 공간이 찰 때 카운터 키가 밀려날 수도 있다.
-- 지출 상한은 조용히 사라지면 안 되는 값이므로 영속 스토리지로 옮긴다.
-- 캐시·레이트리밋은 그대로 Redis 에 둔다 (자주 쓰이고, 사라져도 무해하다).

CREATE TABLE IF NOT EXISTS saju_spend (
  month      TEXT PRIMARY KEY,                 -- 'YYYYMM' (KST 기준)
  calls      INT  NOT NULL DEFAULT 0 CHECK (calls >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 정책을 만들지 않는다 = anon·authenticated 접근 불가. service_role 만 읽고 쓴다.
ALTER TABLE saju_spend ENABLE ROW LEVEL SECURITY;

-- 한도 안이면 +1 하고 ok, 넘으면 증가시키지 않고 ok=false.
-- INSERT .. ON CONFLICT DO UPDATE .. WHERE 로 단일 문장 원자 처리한다.
CREATE OR REPLACE FUNCTION saju_reserve_call(p_month TEXT, p_limit INT)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_calls INT;
BEGIN
  INSERT INTO saju_spend (month, calls) VALUES (p_month, 1)
  ON CONFLICT (month) DO UPDATE
    SET calls = saju_spend.calls + 1, updated_at = now()
    WHERE saju_spend.calls < p_limit
  RETURNING calls INTO v_calls;

  IF v_calls IS NULL THEN
    SELECT calls INTO v_calls FROM saju_spend WHERE month = p_month;
    RETURN jsonb_build_object('ok', false, 'count', COALESCE(v_calls, 0));
  END IF;
  RETURN jsonb_build_object('ok', true, 'count', v_calls);
END $$;

-- LLM 호출이 실패했을 때 되돌린다.
CREATE OR REPLACE FUNCTION saju_release_call(p_month TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE saju_spend SET calls = GREATEST(calls - 1, 0), updated_at = now() WHERE month = p_month;
$$;

REVOKE ALL ON FUNCTION saju_reserve_call(TEXT, INT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION saju_release_call(TEXT)      FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION saju_reserve_call(TEXT, INT) TO service_role;
GRANT EXECUTE ON FUNCTION saju_release_call(TEXT)      TO service_role;
