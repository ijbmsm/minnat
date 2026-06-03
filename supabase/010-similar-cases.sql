-- 민낯 v2: 유사 사례 비교 시스템
-- halfvec 마이그레이션 + 하이브리드 매칭 RPC

-- 1. halfvec 마이그레이션 (float32 → float16, 57% 저장 절감)
ALTER TABLE issue_clusters
  ALTER COLUMN embedding TYPE halfvec(1536)
  USING embedding::halfvec(1536);

-- 2. 유사 사례 검색 RPC (하이브리드: 카테고리 0.4 + 임베딩 코사인 유사도 0.6)
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
    AND (1 - (ic.embedding <=> q_embedding)::FLOAT) >= similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- <10K 이벤트에서는 sequential scan이 충분.
-- 규모 확장 시 아래 HNSW 인덱스 활성화:
-- CREATE INDEX idx_clusters_embedding_hnsw ON issue_clusters
--   USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);
