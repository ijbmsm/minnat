-- ============================================================================
-- 민낯(술자리) — 전체 스키마 셋업 스크립트
--
-- 새 Supabase 프로젝트의 SQL Editor 에 이 파일 전체를 붙여넣고 실행한다.
-- 개별 마이그레이션을 손으로 순서 맞춰 돌릴 필요가 없다.
--
-- 이 파일은 재실행 가능(멱등)하다. 중간에 실패해도 고친 뒤 다시 돌리면 된다.
--   · CREATE TABLE / INDEX  → IF NOT EXISTS
--   · CREATE POLICY / TRIGGER → 선행 DROP IF EXISTS (POLICY 는 IF NOT EXISTS 미지원)
--   · 시드 INSERT → 중복 삽입 방지 가드
-- 원본 마이그레이션 파일은 기록 보존을 위해 그대로 두고, 이 파일 생성 시에만 변환한다.
--
-- 왜 이 파일이 필요한가 — 파일명 순서와 실제 의존성 순서가 다르다:
--   · migration-v1.1.sql 이 issue_clusters 를 CREATE 하고
--     migration-003-events.sql 이 그것을 ALTER 한다 → v1.1 이 먼저여야 한다
--   · issues.category CHECK 제약이 4개 파일에서 재정의된다
--     (schema -> 002 -> v1.1 -> 008). 마지막인 008 이 최종 17종을 정의하므로
--     008 이 v1.1 뒤에 와야 config.py 의 ALL_CATEGORIES 와 일치한다
--   파일명만 보고 정렬하면 두 가지 다 어긋난다.
--
-- 시드 데이터는 SEED.sql 로 분리돼 있다 (선택 실행).
-- 생성: 2026-09-16
-- ============================================================================

-- 적용 순서
--    1. schema.sql                               기본 스키마 — parties, politicians, issues, score_snapshots
--    2. migration-001-validation.sql             검증 컬럼
--    3. migration-002-bill-stages.sql            입법 단계 카테고리
--    4. migration-v1.1.sql                       ★ v1.1 카테고리 체계 + issue_clusters/cluster_issues 생성 (003보다 먼저!)
--    5. migration-003-events.sql                 Event 기반 확장 — issue_clusters를 ALTER하므로 v1.1 이후여야 함
--    6. migration-004-presidents.sql             역대 대통령 테이블군
--    7. migration-005-reports.sql                제보
--    8. migration-006-board.sql                  게시판 1차
--    9. migration-007-auth-board.sql             인증 연동 게시판 — board_posts를 재생성, user_profiles 추가
--   10. migration-008-social-controversy.sql     ★ 최종 category CHECK 제약 (17종). 반드시 v1.1·002 이후
--   11. 009-credit-events.sql                    크레딧 이벤트 — issue_clusters 참조
--   12. 010-similar-cases.sql                    유사 사건
--   13. 011-saju-readings.sql                    사주 풀이 저장
--   14. 012-profile-birth.sql                    프로필 생년월일 — user_profiles ALTER
--   15. 013-saju-ai-cache.sql                    사주 AI 섹션 캐시
--   16. 014-public-share.sql                     공개 공유
--   17. 015-crawler-dedup-and-assembly.sql       크롤러 중복 제거 인덱스 + 의원 고유코드


-- ============================================================================
-- 사전 점검 — 이 스크립트는 "신규 프로젝트" 전용이다
--
-- 빈 DB 에서는 몇 번을 돌려도 안전하다(멱등). 그러나 데이터가 쌓인 뒤에는
-- 돌리면 안 된다. 중간의 v1.1 구간이 issues/score_snapshots 를 비우고,
-- 카테고리 제약을 구버전으로 되돌렸다가 다시 올리기 때문이다.
--
-- 데이터가 있는 DB 에 스키마 변경만 적용하려면 개별 마이그레이션 파일을
-- 직접 실행할 것 (README.md 의 적용 순서 참조).
-- ============================================================================
DO $preflight$
DECLARE
  n BIGINT := 0;
BEGIN
  IF to_regclass('public.issues') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.issues' INTO n;
  END IF;
  IF n > 0 THEN
    RAISE EXCEPTION
      E'중단: issues 테이블에 이미 %건의 데이터가 있습니다.\n'
      '  SETUP.sql 은 신규 프로젝트 전용입니다 (중간에 TRUNCATE 가 있습니다).\n'
      '  스키마만 갱신하려면 개별 마이그레이션 파일을 순서대로 실행하세요 — README.md 참조.',
      n;
  END IF;
END
$preflight$;


-- ==========================================================================
-- [1/17] schema.sql
-- 기본 스키마 — parties, politicians, issues, score_snapshots
-- ==========================================================================

-- 민낯 (minnat) DB 스키마
-- Supabase SQL Editor에서 실행

-- 정당/진영
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 정치인
CREATE TABLE IF NOT EXISTS politicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party_id UUID REFERENCES parties(id),
  position TEXT,
  region TEXT,
  profile_image TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 이슈 (핵심 테이블)
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'crime', 'corruption', 'hypocrisy', 'slander', 'division',
    'policy_fail', 'charity', 'policy_win', 'promise_kept',
    'promise_broke', 'controversial'
  )),
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red')),
  politician_id UUID REFERENCES politicians(id),
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('mild', 'normal', 'severe', 'extreme')),
  impact_scope TEXT DEFAULT 'national' CHECK (impact_scope IN ('individual', 'regional', 'national', 'international')),
  source_tier INTEGER NOT NULL CHECK (source_tier BETWEEN 1 AND 4),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  raw_score NUMERIC NOT NULL DEFAULT 0,
  weighted_score NUMERIC NOT NULL DEFAULT 0,
  ai_analysis JSONB,
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  verified BOOLEAN DEFAULT false,
  verification_note TEXT
);

-- 점수 스냅샷 (일별 캐싱)
CREATE TABLE IF NOT EXISTS score_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  blue_negative NUMERIC NOT NULL DEFAULT 0,
  blue_positive NUMERIC NOT NULL DEFAULT 0,
  red_negative NUMERIC NOT NULL DEFAULT 0,
  red_positive NUMERIC NOT NULL DEFAULT 0,
  blue_net NUMERIC NOT NULL DEFAULT 0,
  red_net NUMERIC NOT NULL DEFAULT 0,
  blue_pct NUMERIC NOT NULL DEFAULT 50,
  red_pct NUMERIC NOT NULL DEFAULT 50,
  breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_issues_camp ON issues(camp);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_published ON issues(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_issues_verified ON issues(verified);
CREATE INDEX IF NOT EXISTS idx_score_snapshots_date ON score_snapshots(date DESC);

-- RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

-- 읽기는 모두 가능
DROP POLICY IF EXISTS "public_read_issues" ON issues;
CREATE POLICY "public_read_issues" ON issues FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_parties" ON parties;
CREATE POLICY "public_read_parties" ON parties FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_politicians" ON politicians;
CREATE POLICY "public_read_politicians" ON politicians FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_snapshots" ON score_snapshots;
CREATE POLICY "public_read_snapshots" ON score_snapshots FOR SELECT USING (true);

-- 쓰기는 service_role만 (크롤러/관리자)
DROP POLICY IF EXISTS "service_write_issues" ON issues;
CREATE POLICY "service_write_issues" ON issues FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_issues" ON issues;
CREATE POLICY "service_update_issues" ON issues FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_snapshots" ON score_snapshots;
CREATE POLICY "service_write_snapshots" ON score_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 시드 데이터: 정당
INSERT INTO parties (name, color, camp)
SELECT * FROM (VALUES
  ('더불어민주당', 'blue', 'blue'),
  ('국민의힘', 'red', 'red')
) AS v(name, color, camp)
WHERE NOT EXISTS (SELECT 1 FROM parties);


-- ==========================================================================
-- [2/17] migration-001-validation.sql
-- 검증 컬럼
-- ==========================================================================

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


-- ==========================================================================
-- [3/17] migration-002-bill-stages.sql
-- 입법 단계 카테고리
-- ==========================================================================

-- 입법 5단계 카테고리 확장
-- Supabase SQL Editor에서 실행

-- 기존 category CHECK 제약조건 삭제 후 재생성
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE issues ADD CONSTRAINT issues_category_check CHECK (category IN (
  'crime', 'corruption', 'hypocrisy', 'slander', 'division',
  'policy_fail', 'policy_win',
  'bill_proposed', 'bill_committee', 'bill_plenary', 'bill_promulgated', 'bill_enforced',
  'promise_kept', 'promise_broke',
  'charity', 'controversial'
));


-- ==========================================================================
-- [4/17] migration-v1.1.sql
-- ★ v1.1 카테고리 체계 + issue_clusters/cluster_issues 생성 (003보다 먼저!)
-- ==========================================================================

-- 민낯 v1.1 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. 기존 데이터 전체 삭제
--
-- [안전 장치] 원본 v1.1 마이그레이션은 카테고리 체계가 비호환으로 바뀌면서
-- 기존 이슈를 무조건 비웠다. 신규 프로젝트에서는 빈 테이블이라 무해하지만,
-- 데이터가 쌓인 뒤 이 스크립트를 다시 돌리면 이슈가 전부 사라진다.
-- (SEED.sql 적용 후 재실행이 대표적인 사고 경로)
-- 비어 있을 때만 진행하고, 아니면 중단한다.
DO $truncate_guard$
DECLARE
  n_issues BIGINT := 0;
  n_snaps  BIGINT := 0;
BEGIN
  IF to_regclass('public.issues') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.issues' INTO n_issues;
  END IF;
  IF to_regclass('public.score_snapshots') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.score_snapshots' INTO n_snaps;
  END IF;

  IF n_issues > 0 OR n_snaps > 0 THEN
    RAISE EXCEPTION
      'issues %건, score_snapshots %건이 이미 있습니다. 이 구간은 두 테이블을 비웁니다. '
      'v1.1 카테고리 재편이 정말 필요한 게 아니라면 중단하세요. '
      '스키마만 다시 맞추려면 이 DO 블록과 아래 TRUNCATE 두 줄을 지우고 실행하세요.',
      n_issues, n_snaps;
  END IF;

  TRUNCATE issues CASCADE;
  TRUNCATE score_snapshots CASCADE;
END
$truncate_guard$;

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
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
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
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_camp_check;
ALTER TABLE issues ADD CONSTRAINT issues_camp_check CHECK (camp IN ('blue', 'red'));

-- 6. criminal_stage CHECK
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_criminal_stage_check;
ALTER TABLE issues ADD CONSTRAINT issues_criminal_stage_check CHECK (
  criminal_stage IS NULL OR criminal_stage IN (
    'investigation', 'indicted', 'suspended_indictment',
    'guilty_1st', 'guilty_2nd', 'confirmed', 'pardoned',
    'not_guilty', 'no_charges', 'dismissed'
  )
);

-- 7. trust_level CHECK
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_trust_level_check;
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

DROP POLICY IF EXISTS "public_read_clusters" ON issue_clusters;
CREATE POLICY "public_read_clusters" ON issue_clusters FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_cluster_issues" ON cluster_issues;
CREATE POLICY "public_read_cluster_issues" ON cluster_issues FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_responses" ON politician_responses;
CREATE POLICY "public_read_responses" ON politician_responses FOR SELECT USING (true);

-- 12. 인덱스
CREATE INDEX IF NOT EXISTS idx_issues_trust ON issues(trust_level);
CREATE INDEX IF NOT EXISTS idx_issues_archive ON issues(is_archive);
CREATE INDEX IF NOT EXISTS idx_issues_criminal ON issues(criminal_stage);


-- ==========================================================================
-- [5/17] migration-003-events.sql
-- Event 기반 확장 — issue_clusters를 ALTER하므로 v1.1 이후여야 함
-- ==========================================================================

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
DROP POLICY IF EXISTS "service_write_clusters" ON issue_clusters;
CREATE POLICY "service_write_clusters" ON issue_clusters
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_clusters" ON issue_clusters;
CREATE POLICY "service_update_clusters" ON issue_clusters
  FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_cluster_issues" ON cluster_issues;
CREATE POLICY "service_write_cluster_issues" ON cluster_issues
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- issues.event_id 업데이트 허용 (기존 service_update_issues 정책이 커버)


-- ==========================================================================
-- [6/17] migration-004-presidents.sql
-- 역대 대통령 테이블군
-- ==========================================================================

-- 전 대통령 전용 섹션 마이그레이션
-- Supabase SQL Editor에서 실행

-- 1. 대통령 프로필 (politicians 1:1 확장)
CREATE TABLE IF NOT EXISTS president_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID REFERENCES politicians(id) UNIQUE,
  term_start DATE NOT NULL,
  term_end DATE,
  term_number INTEGER,
  term_ended_by TEXT CHECK (term_ended_by IN ('normal', 'impeachment', 'resignation', 'assassination', 'coup', 'ongoing')),
  party_at_time TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 가족·측근 비리
CREATE TABLE IF NOT EXISTS president_associates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id UUID REFERENCES president_profiles(id),
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  category TEXT NOT NULL,
  criminal_stage TEXT,
  description TEXT NOT NULL,
  sentence TEXT,
  date DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 사면 기록
CREATE TABLE IF NOT EXISTS president_pardons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id UUID REFERENCES president_profiles(id),
  direction TEXT NOT NULL CHECK (direction IN ('granted', 'received')),
  target_name TEXT NOT NULL,
  target_role TEXT,
  original_charge TEXT,
  original_sentence TEXT,
  pardon_date DATE NOT NULL,
  pardoned_by TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 경제 성적표
CREATE TABLE IF NOT EXISTS president_economy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id UUID REFERENCES president_profiles(id),
  year INTEGER NOT NULL,
  gdp_growth NUMERIC,
  unemployment NUMERIC,
  inflation NUMERIC,
  household_debt_gdp NUMERIC,
  gini_coefficient NUMERIC,
  source TEXT DEFAULT '통계청/한국은행',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(president_id, year)
);

-- 5. 공약 이행률
CREATE TABLE IF NOT EXISTS president_promises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id UUID REFERENCES president_profiles(id),
  promise TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL CHECK (status IN ('fulfilled', 'partial', 'broken', 'ongoing', 'not_started', 'impossible')),
  detail TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 낙하산 인사
CREATE TABLE IF NOT EXISTS president_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  president_id UUID REFERENCES president_profiles(id),
  appointee_name TEXT NOT NULL,
  position_appointed TEXT NOT NULL,
  issue TEXT NOT NULL,
  result TEXT,
  date DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. RLS
ALTER TABLE president_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE president_associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE president_pardons ENABLE ROW LEVEL SECURITY;
ALTER TABLE president_economy ENABLE ROW LEVEL SECURITY;
ALTER TABLE president_promises ENABLE ROW LEVEL SECURITY;
ALTER TABLE president_appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_president_profiles" ON president_profiles;
CREATE POLICY "public_read_president_profiles" ON president_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_president_associates" ON president_associates;
CREATE POLICY "public_read_president_associates" ON president_associates FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_president_pardons" ON president_pardons;
CREATE POLICY "public_read_president_pardons" ON president_pardons FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_president_economy" ON president_economy;
CREATE POLICY "public_read_president_economy" ON president_economy FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_president_promises" ON president_promises;
CREATE POLICY "public_read_president_promises" ON president_promises FOR SELECT USING (true);
DROP POLICY IF EXISTS "public_read_president_appointments" ON president_appointments;
CREATE POLICY "public_read_president_appointments" ON president_appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_write_president_profiles" ON president_profiles;
CREATE POLICY "service_write_president_profiles" ON president_profiles FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_president_associates" ON president_associates;
CREATE POLICY "service_write_president_associates" ON president_associates FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_president_pardons" ON president_pardons;
CREATE POLICY "service_write_president_pardons" ON president_pardons FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_president_economy" ON president_economy;
CREATE POLICY "service_write_president_economy" ON president_economy FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_president_promises" ON president_promises;
CREATE POLICY "service_write_president_promises" ON president_promises FOR INSERT WITH CHECK (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_write_president_appointments" ON president_appointments;
CREATE POLICY "service_write_president_appointments" ON president_appointments FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service_update_president_profiles" ON president_profiles;
CREATE POLICY "service_update_president_profiles" ON president_profiles FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_president_associates" ON president_associates;
CREATE POLICY "service_update_president_associates" ON president_associates FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_president_pardons" ON president_pardons;
CREATE POLICY "service_update_president_pardons" ON president_pardons FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_president_economy" ON president_economy;
CREATE POLICY "service_update_president_economy" ON president_economy FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_president_promises" ON president_promises;
CREATE POLICY "service_update_president_promises" ON president_promises FOR UPDATE USING (auth.role() = 'service_role');
DROP POLICY IF EXISTS "service_update_president_appointments" ON president_appointments;
CREATE POLICY "service_update_president_appointments" ON president_appointments FOR UPDATE USING (auth.role() = 'service_role');

-- 8. 인덱스
CREATE INDEX IF NOT EXISTS idx_president_associates_pid ON president_associates(president_id);
CREATE INDEX IF NOT EXISTS idx_president_pardons_pid ON president_pardons(president_id);
CREATE INDEX IF NOT EXISTS idx_president_economy_pid ON president_economy(president_id);
CREATE INDEX IF NOT EXISTS idx_president_promises_pid ON president_promises(president_id);
CREATE INDEX IF NOT EXISTS idx_president_appointments_pid ON president_appointments(president_id);


-- ==========================================================================
-- [7/17] migration-005-reports.sql
-- 제보
-- ==========================================================================

-- 누락 기록 제보 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_name TEXT NOT NULL DEFAULT '익명',
  actor_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  source_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 누구나 제보 가능 (INSERT)
DROP POLICY IF EXISTS "anyone_can_report" ON reports;
CREATE POLICY "anyone_can_report" ON reports FOR INSERT WITH CHECK (true);

-- 본인 제보만 조회 가능하게 하려면 auth 필요하지만, 일단 공개 읽기
DROP POLICY IF EXISTS "public_read_reports" ON reports;
CREATE POLICY "public_read_reports" ON reports FOR SELECT USING (true);

-- service_role만 상태 변경
DROP POLICY IF EXISTS "service_update_reports" ON reports;
CREATE POLICY "service_update_reports" ON reports FOR UPDATE USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);


-- ==========================================================================
-- [8/17] migration-006-board.sql
-- 게시판 1차
-- ==========================================================================

-- 게시판 테이블
-- Supabase SQL Editor에서 실행

CREATE TABLE IF NOT EXISTS board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기
DROP POLICY IF EXISTS "public_read_posts" ON board_posts;
CREATE POLICY "public_read_posts" ON board_posts FOR SELECT USING (true);

-- 누구나 작성
DROP POLICY IF EXISTS "anyone_can_post" ON board_posts;
CREATE POLICY "anyone_can_post" ON board_posts FOR INSERT WITH CHECK (true);

-- 누구나 업데이트 (비밀번호 검증은 API에서)
DROP POLICY IF EXISTS "anyone_can_update_posts" ON board_posts;
CREATE POLICY "anyone_can_update_posts" ON board_posts FOR UPDATE USING (true);

-- 누구나 삭제 (비밀번호 검증은 API에서)
DROP POLICY IF EXISTS "anyone_can_delete_posts" ON board_posts;
CREATE POLICY "anyone_can_delete_posts" ON board_posts FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at DESC);


-- ==========================================================================
-- [9/17] migration-007-auth-board.sql
-- 인증 연동 게시판 — board_posts를 재생성, user_profiles 추가
-- ==========================================================================

-- [안전 장치] 원본은 board_posts 를 무조건 DROP 한다. 최초 셋업에서는 바로 앞
-- 006 이 만든 빈 테이블이라 안전하지만, 운영 중인 DB 에 다시 돌리면 게시글이
-- 전부 사라진다. 비어 있을 때만 진행하도록 막는다.
DO $guard$
DECLARE
  n BIGINT := 0;
BEGIN
  IF to_regclass('public.board_posts') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.board_posts' INTO n;
    IF n > 0 THEN
      RAISE EXCEPTION
        'board_posts 에 %건의 데이터가 있어 중단합니다. 데이터를 확인하고 수동으로 진행하세요.', n;
    END IF;
  END IF;
END
$guard$;

-- ============================================================
-- Phase 1-1: 인증 + 게시판 통합 마이그레이션
-- 기존 migration-006-board.sql 의 board_posts 를 교체
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 기존 board_posts 제거 (데이터 없으므로 안전)
DROP TABLE IF EXISTS board_posts CASCADE;

-- ── 1. 유저 프로필 (Supabase Auth 확장) ──
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_nickname TEXT,
  profile_image TEXT,
  display_camp TEXT DEFAULT 'free' CHECK (display_camp IN ('blue', 'red', 'free')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. 게시글 ──
CREATE TABLE IF NOT EXISTS board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red', 'free')),
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 100),
  content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 5000),
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. 추천 (1인 1추천) ──
CREATE TABLE IF NOT EXISTS board_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- ── 4. 인덱스 ──
CREATE INDEX IF NOT EXISTS idx_board_posts_created ON board_posts(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_camp ON board_posts(camp, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_posts_popular ON board_posts(like_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_board_likes_post ON board_likes(post_id);

-- ── 5. RLS ──
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_likes ENABLE ROW LEVEL SECURITY;

-- user_profiles
DROP POLICY IF EXISTS "profiles_public_read" ON user_profiles;
CREATE POLICY "profiles_public_read" ON user_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_owner_insert" ON user_profiles;
CREATE POLICY "profiles_owner_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_owner_update" ON user_profiles;
CREATE POLICY "profiles_owner_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- board_posts
DROP POLICY IF EXISTS "posts_public_read" ON board_posts;
CREATE POLICY "posts_public_read" ON board_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "posts_auth_insert" ON board_posts;
CREATE POLICY "posts_auth_insert" ON board_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "posts_owner_delete" ON board_posts;
CREATE POLICY "posts_owner_delete" ON board_posts FOR DELETE USING (auth.uid() = user_id);

-- board_likes
DROP POLICY IF EXISTS "likes_public_read" ON board_likes;
CREATE POLICY "likes_public_read" ON board_likes FOR SELECT USING (true);
DROP POLICY IF EXISTS "likes_auth_insert" ON board_likes;
CREATE POLICY "likes_auth_insert" ON board_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "likes_owner_delete" ON board_likes;
CREATE POLICY "likes_owner_delete" ON board_likes FOR DELETE USING (auth.uid() = user_id);

-- ── 6. 추천수 자동 갱신 트리거 ──
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE board_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE board_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_like_count ON board_likes;
DROP TRIGGER IF EXISTS trg_like_count ON board_likes;
CREATE TRIGGER trg_like_count
  AFTER INSERT OR DELETE ON board_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- ── 7. 유저 프로필 자동 생성 트리거 ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, kakao_nickname, profile_image)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '사용자'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ==========================================================================
-- [10/17] migration-008-social-controversy.sql
-- ★ 최종 category CHECK 제약 (17종). 반드시 v1.1·002 이후
-- ==========================================================================

-- 사회 이슈(social_controversy) 카테고리 추가
-- Supabase SQL Editor에서 실행

-- issues 테이블 카테고리 CHECK 업데이트
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE issues ADD CONSTRAINT issues_category_check CHECK (category IN (
  -- 점수 카테고리
  'criminal_conviction', 'civil_judgment', 'ethics_violation',
  'factcheck_false', 'self_admission', 'official_misconduct',
  -- Archive 카테고리
  'controversial_statement', 'policy_record', 'attendance_record',
  'media_coverage', 'politician_sns', 'social_controversy',
  -- 입법 기록
  'bill_proposed', 'bill_committee', 'bill_plenary',
  'bill_promulgated', 'bill_enforced'
));


-- ==========================================================================
-- [11/17] 009-credit-events.sql
-- 크레딧 이벤트 — issue_clusters 참조
-- ==========================================================================

-- 민낯 v2: 감경 이벤트 테이블
-- 양형기준 2단계 인자 체계 (특별감경 / 일반감경)

CREATE TABLE IF NOT EXISTS credit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES issue_clusters(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red')),
  credit_type TEXT NOT NULL CHECK (credit_type IN ('special', 'general')),
  credit_category TEXT NOT NULL CHECK (credit_category IN (
    'damage_recovery', 'voluntary_surrender', 'whistleblowing', 'legislative_achievement',
    'full_attendance', 'asset_disclosure', 'ethics_clean', 'oversight_active', 'donation_legal'
  )),
  description TEXT,
  source_url TEXT,
  source_name TEXT,
  verified BOOLEAN DEFAULT false,
  credit_value NUMERIC NOT NULL DEFAULT 0 CHECK (credit_value >= 0 AND credit_value <= 1),
  effective_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_credit_events_event ON credit_events(event_id);
CREATE INDEX IF NOT EXISTS idx_credit_events_actor ON credit_events(actor_name);
CREATE INDEX IF NOT EXISTS idx_credit_events_camp ON credit_events(camp);

-- RLS: 공개 읽기, service_role만 쓰기
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_credits" ON credit_events;
CREATE POLICY "public_read_credits" ON credit_events FOR SELECT USING (true);


-- ==========================================================================
-- [12/17] 010-similar-cases.sql
-- 유사 사건
-- ==========================================================================

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
-- CREATE INDEX IF NOT EXISTS idx_clusters_embedding_hnsw ON issue_clusters
--   USING hnsw (embedding halfvec_cosine_ops) WITH (m = 16, ef_construction = 64);


-- ==========================================================================
-- [13/17] 011-saju-readings.sql
-- 사주 풀이 저장
-- ==========================================================================

-- saju_readings: 회원별 사주 열람 기록
-- cache_key 는 Redis 키와 동일 (deterministic) — 동일 차트 재조회 시 upsert

CREATE TABLE IF NOT EXISTS saju_readings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 사주 종류
  type            TEXT NOT NULL CHECK (type IN ('full', 'today', 'love', 'career')),

  -- 출생 정보 (재조회 시 폼 복원용)
  birth_year      SMALLINT NOT NULL,
  birth_month     SMALLINT NOT NULL,
  birth_day       SMALLINT NOT NULL,
  birth_hour      SMALLINT,                          -- NULL = 시간 모름
  birth_minute    SMALLINT NOT NULL DEFAULT 0,       -- 분 (0~59)
  birth_sex       TEXT NOT NULL CHECK (birth_sex IN ('male', 'female')),
  birth_longitude REAL NOT NULL DEFAULT 127.0,
  birth_name      TEXT,
  concern         TEXT,

  -- 결과 캐시
  cache_key       TEXT NOT NULL,                     -- Redis 키와 동일

  -- 일간 (표시용)
  day_stem        TEXT,
  day_element     TEXT,

  -- 타임스탬프
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 동일 사용자 + 동일 캐시키 → upsert 기준
CREATE UNIQUE INDEX IF NOT EXISTS saju_readings_user_cache
  ON saju_readings (user_id, cache_key);

-- 최근 열람 순 조회
CREATE INDEX IF NOT EXISTS saju_readings_user_viewed
  ON saju_readings (user_id, last_viewed_at DESC);

ALTER TABLE saju_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saju_readings_own" ON saju_readings;
CREATE POLICY "saju_readings_own" ON saju_readings
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ==========================================================================
-- [14/17] 012-profile-birth.sql
-- 프로필 생년월일 — user_profiles ALTER
-- ==========================================================================

-- ============================================================
-- 012: user_profiles에 출생 정보 컬럼 추가
-- 마이페이지 - 폼 자동 입력을 위해 사용자별 출생 정보 저장
-- Supabase SQL Editor에서 실행
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS birth_year     SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_month    SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_day      SMALLINT,
  ADD COLUMN IF NOT EXISTS birth_hour     SMALLINT,   -- NULL = 시간 미상
  ADD COLUMN IF NOT EXISTS birth_minute   SMALLINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS birth_sex      TEXT CHECK (birth_sex IN ('male', 'female')),
  ADD COLUMN IF NOT EXISTS birth_name     TEXT,
  ADD COLUMN IF NOT EXISTS birth_longitude REAL DEFAULT 127.0;


-- ==========================================================================
-- [15/17] 013-saju-ai-cache.sql
-- 사주 AI 섹션 캐시
-- ==========================================================================

-- 013: saju_readings에 AI 섹션 캐시 컬럼 추가
-- 풀이 결과를 DB에 보관 → ID 기반 URL 복원 가능
ALTER TABLE saju_readings
  ADD COLUMN IF NOT EXISTS ai_sections JSONB;


-- ==========================================================================
-- [16/17] 014-public-share.sql
-- 공개 공유
-- ==========================================================================

-- 014: saju_readings 공개 공유 정책
-- UUID 자체가 비추측 가능한 공유 토큰으로 작동
DROP POLICY IF EXISTS "saju_readings_public_select" ON saju_readings;
CREATE POLICY "saju_readings_public_select" ON saju_readings
  FOR SELECT
  USING (true);


-- ==========================================================================
-- [17/17] 015-crawler-dedup-and-assembly.sql
-- 크롤러 중복 제거 인덱스 + 의원 고유코드
-- ==========================================================================

-- 015: 크롤러 비용·품질 개선 지원
-- 1) LLM 호출 전 URL 중복 제거를 위한 인덱스
-- 2) 국회의원 고유코드(NAAS_CD) 보관 — 동명이인 구분 및 멱등 동기화용

-- 최근 N일 source_url 조회가 매 실행 시작 시 1회 발생한다
CREATE INDEX IF NOT EXISTS idx_issues_source_url ON issues (source_url);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues (created_at DESC);

-- 열린국회정보 ALLNAMEMBER의 NAAS_CD
-- 22대 범위에서는 이름→진영 충돌이 0건이라 현재는 이름 기준 매칭으로 충분하지만,
-- 역대 의원으로 범위를 넓히면 동명이인 146명이 생기므로 미리 보관해 둔다.
ALTER TABLE politicians
  ADD COLUMN IF NOT EXISTS assembly_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_politicians_assembly_code
  ON politicians (assembly_code)
  WHERE assembly_code IS NOT NULL;


-- ==========================================================================
-- [18/21] 016-saju-chart-snapshot.sql
-- 사주 원국 스냅샷 + 공개 공유 컬럼 제한
-- ==========================================================================

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


-- ==========================================================================
-- [19/21] 017-saju-credits.sql
-- 사주 크레딧 원장 + RPC
-- ==========================================================================

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


-- ==========================================================================
-- [20/21] 018-saju-invites.sql
-- 궁합 초대 링크 + compat 리딩
-- ==========================================================================

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


-- ==========================================================================
-- [21/21] 019-saju-daily-free.sql
-- 무료 정책 v3 — 하루 한 편
-- ==========================================================================

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


-- ==========================================================================
-- 완료
-- ==========================================================================
DO $done$
BEGIN
  RAISE NOTICE '민낯 스키마 셋업 완료 — 마이그레이션 21건 적용';
END
$done$;
