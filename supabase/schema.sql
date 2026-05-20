-- 민낯 (minnat) DB 스키마
-- Supabase SQL Editor에서 실행

-- 정당/진영
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 정치인
CREATE TABLE politicians (
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
CREATE TABLE issues (
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
CREATE TABLE score_snapshots (
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
CREATE INDEX idx_issues_camp ON issues(camp);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_published ON issues(published_at DESC);
CREATE INDEX idx_issues_verified ON issues(verified);
CREATE INDEX idx_score_snapshots_date ON score_snapshots(date DESC);

-- RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_snapshots ENABLE ROW LEVEL SECURITY;

-- 읽기는 모두 가능
CREATE POLICY "public_read_issues" ON issues FOR SELECT USING (true);
CREATE POLICY "public_read_parties" ON parties FOR SELECT USING (true);
CREATE POLICY "public_read_politicians" ON politicians FOR SELECT USING (true);
CREATE POLICY "public_read_snapshots" ON score_snapshots FOR SELECT USING (true);

-- 쓰기는 service_role만 (크롤러/관리자)
CREATE POLICY "service_write_issues" ON issues FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_update_issues" ON issues FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_write_snapshots" ON score_snapshots FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 시드 데이터: 정당
INSERT INTO parties (name, color, camp) VALUES
  ('더불어민주당', 'blue', 'blue'),
  ('국민의힘', 'red', 'red');
