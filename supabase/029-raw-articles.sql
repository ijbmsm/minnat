-- 029 — 원문 보존 + 재실행 가능한 분석
--
-- 왜 필요한가
--   지금은 기사 원문이 어디에도 안 남는다. issues 에 content 컬럼이 없고,
--   ai_analysis 에는 source_title(원본 제목)만 들어간다. main.py 주석은
--   "원본은 ai_analysis에 보관" 이라 적혀 있지만 실제로 보관되는 건 제목뿐이다.
--
--   그래서 프롬프트를 고쳐도, 모델을 바꿔도, 임계값을 조정해도 과거를 다시
--   돌려볼 수 없다. 2026-09-25 임베딩 실측을 하려고 라이브 수집을 다시 하면서
--   $1.32 를 썼다 — 원문이 있었으면 공짜였다.
--
--   분석을 "원문에서 파생되는 계산" 으로 만들면 바꾸고·재현하고·비교하는
--   루프가 돌기 시작한다. 품질 개선이 추측에서 측정으로 바뀐다.
--
-- 적용: Supabase SQL Editor 에서 이 파일을 실행한다.
--       크롤러는 이 테이블이 없어도 죽지 않는다(경고만 찍는다).

create table if not exists raw_articles (
  id            uuid primary key default gen_random_uuid(),

  -- 수집한 그대로. 가공하지 않는다
  source_url    text not null,
  title         text not null,
  content       text not null default '',
  source_name   text not null default '',
  source_tier   int  not null default 3,
  published_at  timestamptz,

  collected_at  timestamptz not null default now(),
  -- 같은 URL 이 내용이 바뀌어 다시 들어올 때를 가른다 (기사 수정·종합 기사)
  content_hash  text not null,

  -- ── 분석 추적 ──
  -- 무엇으로 분석했는지 남긴다. 프롬프트나 모델을 바꾸면 이 값이 달라지고,
  -- "현재 버전으로 아직 안 본 기사" 를 질의 하나로 뽑을 수 있다.
  analyzed_at      timestamptz,
  analyzer_version text,
  prompt_hash      text,
  model            text,

  -- 분석은 했는데 저장까지 못 간 이유. 지금은 집계 숫자로만 남고 사라진다
  skip_reason      text
);

-- 같은 기사를 두 번 담지 않는다. 내용이 바뀌면 다른 행이다
create unique index if not exists raw_articles_url_hash_idx
  on raw_articles (source_url, content_hash);

-- "아직 이 버전으로 안 본 것" — 재분석 배치가 매번 쓰는 질의
create index if not exists raw_articles_pending_idx
  on raw_articles (analyzer_version, collected_at desc);

create index if not exists raw_articles_collected_idx
  on raw_articles (collected_at desc);

-- 분석 결과가 어느 원문에서 나왔는지
alter table issues add column if not exists raw_article_id uuid
  references raw_articles(id) on delete set null;

-- 이 행이 무엇으로 만들어졌는지. 프롬프트를 바꾼 뒤 전후 비교를 하려면 필요하다
alter table issues add column if not exists analyzer_version text;
alter table issues add column if not exists prompt_hash      text;
alter table issues add column if not exists model            text;

create index if not exists issues_raw_article_idx on issues (raw_article_id);
create index if not exists issues_analyzer_version_idx on issues (analyzer_version);

-- RLS — 원문은 공개하지 않는다. 저작권 때문에 화면에는 AI 생성 헤드라인만 나간다.
-- 서비스 키(크롤러)만 읽고 쓴다.
alter table raw_articles enable row level security;

drop policy if exists raw_articles_service_only on raw_articles;
create policy raw_articles_service_only on raw_articles
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

comment on table raw_articles is
  '수집 원문. 분석은 여기서 파생되는 계산이라 언제든 다시 돌릴 수 있다. 저작권상 화면에 직접 노출하지 않는다.';
