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
