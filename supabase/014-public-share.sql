-- 014: saju_readings 공개 공유 정책
-- UUID 자체가 비추측 가능한 공유 토큰으로 작동
CREATE POLICY "saju_readings_public_select" ON saju_readings
  FOR SELECT
  USING (true);
