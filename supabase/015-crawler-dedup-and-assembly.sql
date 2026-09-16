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
