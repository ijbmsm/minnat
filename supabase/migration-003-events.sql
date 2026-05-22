-- 민낯 v1.1 → Event 기반 중복 감지 마이그레이션
-- issue_clusters를 "사건(Event)" 테이블로 확장
-- Supabase SQL Editor에서 실행

-- 1. pgvector 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. issue_clusters 확장 (기존 테이블에 컬럼 추가)
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS camp TEXT CHECK (camp IN ('blue', 'red'));
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS coverage_count INTEGER DEFAULT 1;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS headline_days INTEGER DEFAULT 1;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS first_reported_at TIMESTAMPTZ;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS last_reported_at TIMESTAMPTZ;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS weighted_score NUMERIC DEFAULT 0;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS cross_verified_sources JSONB DEFAULT '[]';
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS position_weight NUMERIC DEFAULT 0.8;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS criminal_stage TEXT;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS source_tier INTEGER DEFAULT 3;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE issue_clusters ADD COLUMN IF NOT EXISTS summary TEXT;

-- 3. issues에 event_id FK 추가
ALTER TABLE issues ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES issue_clusters(id);

-- 4. 인덱스
CREATE INDEX IF NOT EXISTS idx_clusters_actor_cat ON issue_clusters(actor_name, category);
CREATE INDEX IF NOT EXISTS idx_clusters_active ON issue_clusters(is_active, last_reported_at);
CREATE INDEX IF NOT EXISTS idx_clusters_camp ON issue_clusters(camp);
CREATE INDEX IF NOT EXISTS idx_issues_event ON issues(event_id);

-- pgvector IVFFlat 인덱스 (데이터 100건 이상 쌓인 후 실행 권장)
-- CREATE INDEX IF NOT EXISTS idx_clusters_embedding ON issue_clusters
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 5. RLS 정책 (issue_clusters는 이미 migration-v1.1에서 설정됨)
-- service_role 쓰기 정책 추가
CREATE POLICY "service_write_clusters" ON issue_clusters
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_clusters" ON issue_clusters
  FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_write_cluster_issues" ON cluster_issues
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- issues.event_id 업데이트 허용 (기존 service_update_issues 정책이 커버)
