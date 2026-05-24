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

CREATE POLICY "public_read_president_profiles" ON president_profiles FOR SELECT USING (true);
CREATE POLICY "public_read_president_associates" ON president_associates FOR SELECT USING (true);
CREATE POLICY "public_read_president_pardons" ON president_pardons FOR SELECT USING (true);
CREATE POLICY "public_read_president_economy" ON president_economy FOR SELECT USING (true);
CREATE POLICY "public_read_president_promises" ON president_promises FOR SELECT USING (true);
CREATE POLICY "public_read_president_appointments" ON president_appointments FOR SELECT USING (true);

CREATE POLICY "service_write_president_profiles" ON president_profiles FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_write_president_associates" ON president_associates FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_write_president_pardons" ON president_pardons FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_write_president_economy" ON president_economy FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_write_president_promises" ON president_promises FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "service_write_president_appointments" ON president_appointments FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_update_president_profiles" ON president_profiles FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_update_president_associates" ON president_associates FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_update_president_pardons" ON president_pardons FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_update_president_economy" ON president_economy FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_update_president_promises" ON president_promises FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "service_update_president_appointments" ON president_appointments FOR UPDATE USING (auth.role() = 'service_role');

-- 8. 인덱스
CREATE INDEX IF NOT EXISTS idx_president_associates_pid ON president_associates(president_id);
CREATE INDEX IF NOT EXISTS idx_president_pardons_pid ON president_pardons(president_id);
CREATE INDEX IF NOT EXISTS idx_president_economy_pid ON president_economy(president_id);
CREATE INDEX IF NOT EXISTS idx_president_promises_pid ON president_promises(president_id);
CREATE INDEX IF NOT EXISTS idx_president_appointments_pid ON president_appointments(president_id);
