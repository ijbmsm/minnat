-- 입법 5단계 카테고리 확장
-- Supabase SQL Editor에서 실행

-- 기존 category CHECK 제약조건 삭제 후 재생성
ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_category_check;
ALTER TABLE issues ADD CONSTRAINT issues_category_check CHECK (category IN (
  'crime', 'corruption', 'hypocrisy', 'slander', 'division',
  'policy_fail', 'policy_win',
  'bill_proposed', 'bill_committee', 'bill_plenary', 'bill_promulgated', 'bill_enforced',
  'promise_kept', 'promise_broke',
  'charity', 'controversial'
));
