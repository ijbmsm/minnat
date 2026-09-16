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
