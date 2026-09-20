-- 028. 제도적 결정 단계(institutional_stage)
--
-- criminal_stage 는 형사 절차(수사→기소→1심→…→확정)만 모델링한다. 그런데 국회
-- 탄핵소추 가결이나 헌법재판소 인용·기각은 형사 절차가 아니다. 담을 어휘가 없으니
-- 분류기가 억지로 형사 단계를 골랐고, 같은 종류의 결정이 제각각으로 저장됐다:
--
--   노무현 탄핵 — 헌재 기각        ethics_violation    / dismissed
--   윤석열 국회 탄핵소추안 가결     criminal_conviction / investigation
--   윤석열 헌재 탄핵 인용 파면      criminal_conviction / indicted      ← 확정인데 '혐의'
--   이상민 탄핵소추 헌재 기각       official_misconduct / (없음)
--
-- 그 결과 사안 화면에서 "헌재 전원일치 파면"이 근거등급 '혐의'로 표시됐다.
-- 확정된 제도적 결정을 혐의로 적으면 이 제품이 메우려던 빈틈을 우리가 다시 만든다.

ALTER TABLE issues          ADD COLUMN IF NOT EXISTS institutional_stage TEXT;
ALTER TABLE issue_clusters  ADD COLUMN IF NOT EXISTS institutional_stage TEXT;

DO $$ BEGIN
  ALTER TABLE issues ADD CONSTRAINT issues_institutional_stage_check
    CHECK (institutional_stage IS NULL OR institutional_stage IN (
      'impeachment_proposed',   -- 탄핵소추안 발의
      'impeachment_passed',     -- 국회 가결 → 직무정지
      'impeachment_upheld',     -- 헌재 인용 → 파면 (종국)
      'impeachment_rejected',   -- 헌재 기각·각하 (종국)
      'censure_passed',         -- 해임건의안 가결
      'inquiry_launched'        -- 국정조사·특검 발동
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE issue_clusters ADD CONSTRAINT clusters_institutional_stage_check
    CHECK (institutional_stage IS NULL OR institutional_stage IN (
      'impeachment_proposed', 'impeachment_passed', 'impeachment_upheld',
      'impeachment_rejected', 'censure_passed', 'inquiry_launched'
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN issues.institutional_stage IS
  '국회·헌재 등 제도적 절차의 단계. 형사 절차(criminal_stage)와 다른 축이며, 한 기사가 둘 다 가질 수 있다';

CREATE INDEX IF NOT EXISTS idx_issues_institutional ON issues (institutional_stage)
  WHERE institutional_stage IS NOT NULL;
