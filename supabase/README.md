# 민낯 — DB 셋업

## 새 Supabase 프로젝트에 복구하기

1. Supabase 새 프로젝트 생성
2. SQL Editor 에 **`SETUP.sql`** 전체를 붙여넣고 실행 (스키마)
3. (선택) **`SEED.sql`** 실행 (과거 사건·대통령·전직 정치인 데이터)
4. Project Settings → API 에서 URL·anon key·service_role key 복사
5. 아래 5곳에 반영

| 위치 | 키 |
|---|---|
| `minnat/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `minnat-crawler/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| GitHub secrets (`ijbmsm/minnat-crawler`) | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |
| Vercel (`minnat` 프로젝트) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

6. 크롤러 1회 수동 실행으로 검증: `cd minnat-crawler && python main.py`
   — 마지막 줄의 `[비용]` 출력으로 실제 회당 비용을 확인한다

## ⚠️ SETUP.sql 은 신규 프로젝트 전용

빈 DB 에서는 몇 번을 돌려도 안전하다(멱등). **데이터가 쌓인 뒤에는 돌리면 안 된다** —
중간의 v1.1 구간에 `TRUNCATE issues CASCADE` 가 있다(카테고리 체계가 비호환으로
바뀌던 시점의 원본 동작). 맨 앞의 사전 점검 블록이 `issues` 에 데이터가 있으면
아무것도 실행하지 않고 중단시키지만, 파괴적 구문이 들어 있다는 사실 자체는 알고 있을 것.

데이터가 있는 DB 에 스키마 변경만 적용하려면 **개별 마이그레이션 파일**을
아래 순서대로 직접 실행한다.

| SQL Editor 경고 | 해당 구문 | 신규 프로젝트에서 |
|---|---|---|
| destructive operations | `TRUNCATE issues / score_snapshots` 2건 | 빈 테이블이라 무해 (+ 사전 점검이 막음) |
| | `DROP TABLE IF EXISTS board_posts` 1건 | 직전 006 이 만든 빈 테이블 (+ 가드 있음) |
| | `DROP POLICY/CONSTRAINT/TRIGGER IF EXISTS` 64건 | 멱등성용, 없으면 무시 |

## SETUP.sql 은 왜 따로 있나

개별 마이그레이션 파일을 **파일명 순서대로 실행하면 깨진다.**

- `migration-v1.1.sql` 이 `issue_clusters` 를 CREATE 하고
  `migration-003-events.sql` 이 그것을 ALTER 한다 → **v1.1 이 003 보다 먼저**
- `issues.category` CHECK 제약이 4개 파일에서 재정의된다
  (`schema` → `002` → `v1.1` → `008`). 마지막인 008 이 최종 17종을 정의하므로
  **008 이 v1.1 뒤**에 와야 크롤러 `config.py` 의 `ALL_CATEGORIES` 와 맞는다

`SETUP.sql` 은 의존성 순서대로 재배열하고, 재실행 가능(멱등)하게 변환해 합친 것이다.
원본 마이그레이션 파일은 기록 보존을 위해 그대로 둔다.

## 적용 순서

```
 1. schema.sql                          9. migration-007-auth-board.sql
 2. migration-001-validation.sql       10. migration-008-social-controversy.sql  ★
 3. migration-002-bill-stages.sql      11. 009-credit-events.sql
 4. migration-v1.1.sql            ★    12. 010-similar-cases.sql
 5. migration-003-events.sql           13. 011-saju-readings.sql
 6. migration-004-presidents.sql       14. 012-profile-birth.sql
 7. migration-005-reports.sql          15. 013-saju-ai-cache.sql
 8. migration-006-board.sql            16. 014-public-share.sql
                                       17. 015-crawler-dedup-and-assembly.sql
```

★ = 파일명 순서와 다른 위치. 이유는 위 참조.

## 새 마이그레이션을 추가할 때

1. `0NN-이름.sql` 로 개별 파일 생성 (번호는 015 다음부터)
2. `SETUP.sql` 맨 끝(완료 블록 앞)에도 같은 내용을 추가
3. 아래 방법으로 검증

## 검증 방법 (로컬 Postgres)

실제 Supabase 프로젝트를 만들기 전에 로컬에서 돌려볼 수 있다.
`supabase` 로컬 컨테이너가 떠 있으면(예: 다른 프로젝트의 `supabase start`),
그 안에 격리된 임시 DB 를 만들어 검증한다.

```bash
C=supabase_db_oncast   # 떠 있는 Supabase Postgres 컨테이너 이름

docker exec $C psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS minnat_test;"
docker exec $C psql -U postgres -d postgres -c "CREATE DATABASE minnat_test;"

# Supabase 관리 스키마 최소 스텁 (실제 프로젝트엔 기본 제공)
docker exec -i $C psql -U postgres -d minnat_test <<'SQL'
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT,
  raw_user_meta_data JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now());
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS TEXT LANGUAGE sql STABLE AS $$ SELECT 'service_role'::text $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;
SQL

# 스키마 적용 — 두 번 돌려서 멱등성까지 확인
docker exec -i $C psql -U postgres -d minnat_test -v ON_ERROR_STOP=1 < SETUP.sql
docker exec -i $C psql -U postgres -d minnat_test -v ON_ERROR_STOP=1 < SETUP.sql

# 카테고리 제약이 크롤러 config.py 와 맞는지
docker exec $C psql -U postgres -d minnat_test -tAc \
  "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname='issues_category_check';"

docker exec $C psql -U postgres -d postgres -c "DROP DATABASE minnat_test;"   # 정리
```

## 검증 이력

**2026-09-16** — Postgres 17.6 (격리된 로컬 DB) 에서 4개 시나리오 검증 완료

| # | 시나리오 | 결과 |
|---|---|---|
| 1 | 빈 DB → `SETUP.sql` | 에러 0. 테이블 19 / RLS 정책 46 / 인덱스 54 |
| 2 | 빈 DB → `SETUP.sql` 재실행 | 에러 0 (멱등). 정당 시드 중복 없음 |
| 3 | `SEED.sql` 적용 | 에러 0. 정치인 102 / 이슈 66 / 대통령 14 |
| 4 | **데이터 있는 상태 → `SETUP.sql` 재실행** | **사전 점검이 중단시킴. 이슈 66건 보존 확인** |

`issues_category_check` 17종이 크롤러 `config.py` 의 `ALL_CATEGORIES` 와 완전 일치함도 확인.

## 알아둘 것

- **무료 프로젝트는 약 1주 무활동 시 정지되고, 오래 정지되면 삭제된다.**
  이전 프로젝트(`vmgkdghfkpawjpzyxxiw`)가 그렇게 사라졌다.
  크롤러가 정기적으로 돌면 그 자체가 활동이라 정지되지 않는다 —
  **크롤러를 살려두는 것이 곧 DB 를 지키는 것이다.**
- `SETUP.sql` 의 `migration-007` 구간에는 `board_posts` 를 DROP 하는 원본 동작이 있다.
  운영 중 DB 에서 실수로 돌리는 것을 막기 위해, 게시글이 1건이라도 있으면
  예외를 던지고 중단하는 가드를 넣어 두었다.
