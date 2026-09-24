-- 030 — 사안 재생성 차단
--
-- 왜 필요한가
--   storyline_builder 에 _fingerprint() 가 정의돼 있는데 어디서도 호출되지 않았다.
--   skipped 변수는 0 으로 초기화만 되고 증가하는 코드가 없어 로그에 늘 "건너뜀 0" 이
--   찍혔다. 그래서 3시간마다 사안 전부를 LLM 으로 다시 썼다
--   (실측 2026-09-25: 사안 후보 25개 × 하루 8회 = 200회).
--
--   비용보다 나쁜 건 품질이다. 제목과 요약이 실행마다 바뀌어 같은 사안이
--   읽을 때마다 다른 글이었다. 게다가 slug 까지 LLM 이 줘서 로마자 표기가
--   흔들렸고(lee-jae-myung- 과 leejaemyung- 이 공존), slug 로 기존 사안을 찾던
--   조회가 빗나가 UPDATE 대신 INSERT 가 됐다 — 사안 106건 중 김건희 8벌,
--   조국 6벌, 박근혜 6벌, 의대정원 5벌.
--
--   slug 표류는 코드에서 고쳤다(label 기반 결정론적 slug). 이 마이그레이션은
--   나머지 절반, **구성이 안 바뀌면 원고를 다시 안 쓰는 것**을 켠다.
--
-- 적용: Supabase SQL Editor 에서 실행한다.
--       크롤러는 이 컬럼이 없어도 죽지 않는다 — 중복 방지는 작동하고,
--       지문 비교만 건너뛴다(원고를 매번 다시 쓴다).

alter table storylines add column if not exists fingerprint text;

-- 사안의 **신원**. slug 와 역할이 다르다.
--   group_key — 같은 사안인지 판정하는 키. label 에서 결정론적으로 나온다. 안 바뀐다
--   slug      — 사람이 보는 주소. 읽을 수 있어야 하고, 한 번 정하면 안 바뀐다
-- 예전에는 slug 하나가 두 역할을 겸했고, 그 값을 LLM 이 매번 새로 줬다.
-- 그래서 "같은 사안인가" 판정이 실행마다 흔들렸다.
alter table storylines add column if not exists group_key text;

comment on column storylines.fingerprint is
  '사안을 이루는 사건 id 집합의 sha1. 같으면 원고를 다시 쓰지 않는다.';

comment on column storylines.group_key is
  '사안 신원. label 의 sha1. 이것으로 기존 사안을 찾는다 — slug 로 찾으면 안 된다.';

-- ⚠️ 유일 인덱스는 **기존 중복을 병합한 뒤에** 만든다.
--    지금 만들면 106건 안의 중복(김건희 8벌 등) 때문에 실패한다.
--    merge_duplicate_storylines.py --apply 를 먼저 돌리고 아래를 실행할 것.
--
-- create unique index if not exists storylines_group_key_uniq on storylines (group_key);
-- create unique index if not exists storylines_slug_uniq on storylines (slug);
