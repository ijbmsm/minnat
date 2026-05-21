-- 검증 시스템 확장
-- Supabase SQL Editor에서 실행

-- issues 테이블에 검증 관련 컬럼 추가
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending'
  CHECK (validation_status IN ('passed', 'flagged', 'rejected', 'pending'));
ALTER TABLE issues ADD COLUMN IF NOT EXISTS validation_errors JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS cross_verified_sources JSONB DEFAULT '[]';
ALTER TABLE issues ADD COLUMN IF NOT EXISTS actor_name TEXT;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS actor_party TEXT;

-- 기존 데이터 정리 (잘못된 데이터 flagged로 변경)
UPDATE issues SET validation_status = 'flagged', validation_errors = '["LEGACY_UNVALIDATED"]'
WHERE validation_status IS NULL OR validation_status = 'pending';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_issues_validation ON issues(validation_status);

-- 정치인 시드 데이터 확장
INSERT INTO politicians (name, party_id, position, region, active) VALUES
  -- 더불어민주당 (party_id는 아래에서 동적으로)
  ('이재명', (SELECT id FROM parties WHERE camp='blue'), '대통령', NULL, true),
  ('박찬대', (SELECT id FROM parties WHERE camp='blue'), '원내대표', '부산', true),
  ('이해찬', (SELECT id FROM parties WHERE camp='blue'), '전 대표', NULL, true),
  ('추미애', (SELECT id FROM parties WHERE camp='blue'), '전 대표', NULL, true),
  ('정청래', (SELECT id FROM parties WHERE camp='blue'), '의원', NULL, true),
  ('김민석', (SELECT id FROM parties WHERE camp='blue'), '의원', NULL, true),
  ('진성준', (SELECT id FROM parties WHERE camp='blue'), '의원', NULL, true),
  ('김의겸', (SELECT id FROM parties WHERE camp='blue'), '의원', NULL, true),
  ('한민수', (SELECT id FROM parties WHERE camp='blue'), '의원', NULL, true),
  ('조국',   (SELECT id FROM parties WHERE camp='blue'), '조국혁신당 대표', NULL, true),
  -- 국민의힘
  ('한동훈', (SELECT id FROM parties WHERE camp='red'), '전 대표', NULL, true),
  ('권성동', (SELECT id FROM parties WHERE camp='red'), '원내대표', NULL, true),
  ('나경원', (SELECT id FROM parties WHERE camp='red'), '의원', NULL, true),
  ('윤상현', (SELECT id FROM parties WHERE camp='red'), '의원', NULL, true),
  ('이준석', (SELECT id FROM parties WHERE camp='red'), '전 대표', NULL, true),
  ('김기현', (SELECT id FROM parties WHERE camp='red'), '전 대표', NULL, true),
  ('윤석열', (SELECT id FROM parties WHERE camp='red'), '전 대통령', NULL, true),
  ('한덕수', (SELECT id FROM parties WHERE camp='red'), '전 총리', NULL, true),
  ('오세훈', (SELECT id FROM parties WHERE camp='red'), '서울시장', '서울', true),
  ('홍준표', (SELECT id FROM parties WHERE camp='red'), '대구시장', '대구', true),
  ('이석연', (SELECT id FROM parties WHERE camp='red'), '통합위원장', NULL, true)
ON CONFLICT DO NOTHING;
