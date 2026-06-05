-- 013: saju_readings에 AI 섹션 캐시 컬럼 추가
-- 풀이 결과를 DB에 보관 → ID 기반 URL 복원 가능
ALTER TABLE saju_readings
  ADD COLUMN IF NOT EXISTS ai_sections JSONB;
