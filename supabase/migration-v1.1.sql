-- 민낯 v1.1 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. 기존 데이터 전체 삭제
TRUNCATE issues CASCADE;
TRUNCATE score_snapshots CASCADE;

-- 2. 기존 제약조건 삭제
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_camp_check;
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_severity_check;
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_impact_scope_check;

-- 3. 새 컬럼 추가
ALTER TABLE issues ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'pending';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS criminal_stage TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS coverage_count INTEGER DEFAULT 1;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS headline_days INTEGER DEFAULT 1;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_archive BOOLEAN DEFAULT false;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS position_weight NUMERIC DEFAULT 0.8;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS cross_verified_sources JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS actor_party TEXT;

-- 4. 새 카테고리 CHECK
ALTER TABLE issues ADD CONSTRAINT issues_category_check CHECK (category IN (
  -- 점수 카테고리
  'criminal_conviction', 'civil_judgment', 'ethics_violation',
  'factcheck_false', 'self_admission', 'official_misconduct',
  -- archive 카테고리
  'controversial_statement', 'policy_record', 'attendance_record',
  'media_coverage', 'politician_sns',
  -- 입법 기록
  'bill_proposed', 'bill_committee', 'bill_plenary', 'bill_promulgated', 'bill_enforced'
));

-- 5. camp CHECK 유지
ALTER TABLE issues ADD CONSTRAINT issues_camp_check CHECK (camp IN ('blue', 'red'));

-- 6. criminal_stage CHECK
ALTER TABLE issues ADD CONSTRAINT issues_criminal_stage_check CHECK (
  criminal_stage IS NULL OR criminal_stage IN (
    'investigation', 'indicted', 'suspended_indictment',
    'guilty_1st', 'guilty_2nd', 'confirmed', 'pardoned',
    'not_guilty', 'no_charges', 'dismissed'
  )
);

-- 7. trust_level CHECK
ALTER TABLE issues ADD CONSTRAINT issues_trust_level_check CHECK (
  trust_level IN ('high', 'medium', 'low', 'pending')
);

-- 8. 이슈 클러스터 테이블
CREATE TABLE IF NOT EXISTS issue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_issue_id UUID REFERENCES issues(id),
  issue_count INTEGER DEFAULT 1,
  media_diversity_score NUMERIC DEFAULT 0,
  trust_level TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cluster_issues (
  cluster_id UUID REFERENCES issue_clusters(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, issue_id)
);

-- 9. 정치인 반론 테이블
CREATE TABLE IF NOT EXISTS politician_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID REFERENCES politicians(id),
  issue_id UUID REFERENCES issues(id),
  source_url TEXT NOT NULL,
  source_type TEXT,
  content TEXT,
  collected_at TIMESTAMPTZ DEFAULT now()
);

-- 10. politicians 확장
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS position_weight NUMERIC DEFAULT 0.8;
ALTER TABLE politicians ADD COLUMN IF NOT EXISTS official_sns JSONB DEFAULT '[]';

-- 11. RLS
ALTER TABLE issue_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cluster_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE politician_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_clusters" ON issue_clusters FOR SELECT USING (true);
CREATE POLICY "public_read_cluster_issues" ON cluster_issues FOR SELECT USING (true);
CREATE POLICY "public_read_responses" ON politician_responses FOR SELECT USING (true);

-- 12. 인덱스
CREATE INDEX IF NOT EXISTS idx_issues_trust ON issues(trust_level);
CREATE INDEX IF NOT EXISTS idx_issues_archive ON issues(is_archive);
CREATE INDEX IF NOT EXISTS idx_issues_criminal ON issues(criminal_stage);
