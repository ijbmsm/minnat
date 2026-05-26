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
CREATE POLICY "anyone_can_report" ON reports FOR INSERT WITH CHECK (true);

-- 본인 제보만 조회 가능하게 하려면 auth 필요하지만, 일단 공개 읽기
CREATE POLICY "public_read_reports" ON reports FOR SELECT USING (true);

-- service_role만 상태 변경
CREATE POLICY "service_update_reports" ON reports FOR UPDATE USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at DESC);
