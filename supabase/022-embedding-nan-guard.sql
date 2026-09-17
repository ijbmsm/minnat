-- ==========================================================================
-- 022 — 영벡터 임베딩 정리 + 유사 사례 RPC NaN 가드
--
-- 배경
--   크롤러의 get_embedding() 이 OpenAI 호출에 실패하면 [0.0]*1536 을 돌려줬고,
--   그 영벡터가 issue_clusters.embedding 에 그대로 저장됐다.
--   영벡터는 코사인 거리의 분모가 0이라 pgvector 의 `<=>` 가 NaN 을 낸다.
--   그런데 Postgres 는 IEEE 와 달리 NaN 을 "모든 수보다 큰 값" 으로 취급한다:
--     · NaN >= 0.5        → true   (유사도 임계값을 그냥 통과)
--     · ORDER BY ... DESC → NaN 이 1위
--   결과적으로 "유사 사례" 가 유사도와 무관한 무작위 목록이 됐다.
--
--   2026-09-17 프로덕션 실측: 클러스터 67건 중 NULL 51 / 영벡터 16 / 정상 0.
--   원인은 OpenAI 크레딧 소진이었는데 파이프라인은 계속 성공으로 끝났다.
--
-- 이 마이그레이션이 하는 일
--   1. 이미 저장된 영벡터를 NULL 로 되돌린다 (RPC 가 NULL 은 원래 제외한다)
--   2. RPC 가 NaN 을 절대 통과시키지 않도록 막는다 (앞으로 또 들어와도 안전하게)
--
-- 크롤러 쪽은 별도 수정: 실패 시 영벡터 대신 None 을 반환하고, 전량 실패면
-- 워크플로를 실패로 끝낸다 (minnat-crawler event_matcher.py / main.py).
--
-- 멱등. SQL Editor 에 통째로 붙여넣어 실행할 수 있다.
-- ==========================================================================

-- ── 1. 영벡터 → NULL ─────────────────────────────────────────────────────
-- 판별법: 정상 벡터는 자기 자신과의 코사인 거리가 0 이다.
--         영벡터는 NaN 이 나오고, Postgres 에서 NaN <> 0 은 true 다.
UPDATE issue_clusters
SET embedding = NULL
WHERE embedding IS NOT NULL
  AND (embedding <=> embedding) <> 0;

-- 정리 결과 확인용 (실행하면 남은 영벡터 수가 0 이어야 한다)
--   SELECT count(*) FROM issue_clusters
--   WHERE embedding IS NOT NULL AND (embedding <=> embedding) <> 0;


-- ── 2. RPC NaN 가드 ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_similar_events(
  query_event_id UUID,
  match_count INT DEFAULT 5,
  similarity_threshold FLOAT DEFAULT 0.5
) RETURNS TABLE (
  id UUID,
  representative_issue_id UUID,
  actor_name TEXT,
  category TEXT,
  camp TEXT,
  summary TEXT,
  weighted_score NUMERIC,
  criminal_stage TEXT,
  first_reported_at TIMESTAMPTZ,
  similarity FLOAT
) LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE
  q_embedding halfvec(1536);
  q_category TEXT;
BEGIN
  -- 입력 검증
  IF match_count < 1 OR match_count > 20 THEN
    RAISE EXCEPTION 'match_count must be between 1 and 20';
  END IF;
  IF similarity_threshold < 0 OR similarity_threshold > 1 THEN
    RAISE EXCEPTION 'similarity_threshold must be between 0 and 1';
  END IF;

  -- 기준 이벤트의 임베딩 + 카테고리 조회
  SELECT ic.embedding, ic.category INTO q_embedding, q_category
  FROM issue_clusters ic WHERE ic.id = query_event_id;

  -- 임베딩 없으면 빈 결과
  IF q_embedding IS NULL THEN RETURN; END IF;

  -- 기준 벡터가 영벡터면 비교 자체가 성립하지 않는다 (모든 거리가 NaN)
  IF (q_embedding <=> q_embedding) <> 0 THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    ic.id,
    ic.representative_issue_id,
    ic.actor_name,
    ic.category,
    ic.camp::TEXT,
    ic.summary,
    ic.weighted_score,
    ic.criminal_stage::TEXT,
    ic.first_reported_at,
    (
      CASE WHEN ic.category = q_category THEN 0.4 ELSE 0.0 END
      + (1 - (ic.embedding <=> q_embedding)::FLOAT) * 0.6
    )::FLOAT AS similarity
  FROM issue_clusters ic
  WHERE ic.id != query_event_id
    AND ic.embedding IS NOT NULL
    -- 상대 벡터도 영벡터면 제외 (1번에서 정리했지만 앞으로를 위해 남긴다)
    AND (ic.embedding <=> ic.embedding) = 0
    -- NaN 은 Postgres 에서 임계값 비교를 통과하므로 명시적으로 막는다.
    -- (Postgres 는 IEEE 와 달리 NaN = NaN 을 true 로 보므로 이 비교가 성립한다)
    AND (ic.embedding <=> q_embedding)::FLOAT8 <> 'NaN'::FLOAT8
    AND (1 - (ic.embedding <=> q_embedding)::FLOAT) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_similar_events IS
  '유사 사례 검색. 영벡터·NaN 은 결과에서 제외한다 (022). 임베딩이 없으면 빈 결과.';
