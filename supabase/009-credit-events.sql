-- 민낯 v2: 감경 이벤트 테이블
-- 양형기준 2단계 인자 체계 (특별감경 / 일반감경)

CREATE TABLE credit_events (
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
CREATE INDEX idx_credit_events_event ON credit_events(event_id);
CREATE INDEX idx_credit_events_actor ON credit_events(actor_name);
CREATE INDEX idx_credit_events_camp ON credit_events(camp);

-- RLS: 공개 읽기, service_role만 쓰기
ALTER TABLE credit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_credits" ON credit_events FOR SELECT USING (true);
