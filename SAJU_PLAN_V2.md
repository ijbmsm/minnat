# 술자리 사주 — 빌드 플랜 v2

> 작성일: 2026-09-16
> 근거: `docs/saju-product-research.md` (리서치) + 그 파일에 남긴 `<!-- -->` 코멘트 5건
> 선행 플랜: `SAJU_BUILD_PLAN.md` (M0·M1·M2 — 엔진·기본 UI, 대부분 완료). 이 문서는 그 다음 단계다.
> 이 플랜은 `.agent-team/SPEC.md` 로 쪼갤 수 있게 태스크마다 **파일·변경·완료 기준**을 적었다.

---

## 0. 원칙 (코멘트에서 나온 것)

1. **사용성이 1순위.** 매일 운세 보러 오는 사람은 한 번 막히면 바로 이탈한다. 모든 태스크의 완료 기준에 "모바일에서 탭 수"를 넣는다.
2. **결제 없음.** 사업자·PG 미보유. 유료 자리는 "획득"으로 채우고, 지출은 코드로 상한을 건다.
3. **초대 링크가 핵심 유입.** 커플이 궁합 보려고 공유하는 경로를 1급 기능으로 만든다. 내 정보 입력 → 링크 공유 → 상대가 자기 정보 입력 → **둘 다 무료로 결과.**
4. **결과는 흔들리지 않는다.** 같은 사람이 다시 보면 같은 문장, 같은 원국. 엔진이 바뀌어도 "내가 봤던 것"은 보존한다.

## 1. 확정 결정 (리서치 8절 + 코멘트)

| # | 항목 | 결정 |
|---|---|---|
| ① | 무료 | **하루 한 편** (타입 무관, KST 자정 리셋) + 획득형 크레딧. 2026-09-17 개정 — 이전 "계정당 1회"는 결제가 없어 막다른 길이 됐다 |
| ② | 다시 풀이받기 | 크레딧 1 소모 |
| ③ | 궁합 상대 출생정보 | 저장 (고지 + 이름 선택 + 삭제) |
| ④ | 서머타임·표준시 보정 | 자동 적용 + "보정됨" 표시 |
| ⑤ | 모델 | Sonnet 5 단일, effort medium 시작 |
| ⑥ | 결제 | 없음. 획득 행동 수치 확인 후 재검토 |
| ⑦ | 동일성 정책 | 리서치 3.2 추천안 그대로 (연 단위 갱신, 日은 날짜별) |
| ⑧ | 원국 저장 | **코멘트 반영: 저장한다.** 4주 간지·대운·엔진 버전을 스냅샷으로 남겨 엔진 변경 시에도 "봤던 원국"이 유지된다 |
| ⑨ | 日 오늘의 사주 | 2026-09-17 개정 — 다른 타입과 동일하게 하루 한 편 안에 포함. 매일 오는 사람은 그 한 편을 오늘의 사주로 쓴다 |
| ⑩ | 궁합 초대 수락 | 하루 한 편과 **무관하게** 양쪽 무료 + 양쪽 크레딧 +1. 두 사람을 데려오는 장치라 예외 |

⑧·⑨는 코멘트("너무 다른 결과 나오면 어째?", "매일 한 번씩 확인하는 사람도 있다")를 결정으로 읽은 것이다. 다르면 이 표만 고치면 된다.

---

## 2. 페이즈 개요

```
P0  정확성·안전  (출시 차단 항목)        1주
P1  유입          비로그인 미리보기·계측   1주
P2  크레딧·초대   원장·획득·초대링크·킬스위치  2주
P3  사용성·특화   日 압축·딥링크·타임라인   1~2주
P4  검증          KASI 대조·LLM QA         P1부터 병행
```

의존: P2 는 P0-4(스냅샷)·P0-5(모델) 뒤. P3 는 P2 뒤. P4 는 독립.

---

## P0. 정확성·안전 — 출시 전 차단

### P0-1. 한국 표준시·서머타임 이력 보정 ✅ 완료 (2026-09-16)
- **파일**: `src/lib/saju/engine.ts` `fromKST()` (`birthUTC` 계산부, 현재 `-9` 고정), `src/lib/saju/factsheet.ts` (cautions), `src/lib/saju/__tests__/golden.test.ts`
- **변경**:
  - `KST_OFFSET_RULES: {fromUTC: number, toUTC: number, offsetMin: number, label: string}[]` 테이블 추가. **tzdata `Asia/Seoul` 규칙을 기준으로 작성**하고 출처를 주석에 남긴다. 확실한 구간: 1908-04-01~1911-12-31 UTC+8:30 / 1954-03-21~1961-08-09 UTC+8:30 / 1987-05-10 02:00~1987-10-11 03:00 UTC+10 / 1988-05-08 02:00~1988-10-09 03:00 UTC+10. 1948~51·1955~60 여름 서머타임은 tzdata 대조 후 입력.
  - `fromKST()` 가 입력 시각(현지 시계 시각)에 해당 구간의 오프셋을 적용해 `birthUTC` 를 만든다. `kstHour === null` 경로는 날짜만 쓰므로 영향 없음(그대로).
  - `BirthInput.trace` 에 `tzRule: label | null` 추가 → factsheet `cautions` 에 "출생 당시 표준시/서머타임 보정 적용(UTC+8:30 등)" 문장 → 결과 UI 상단 한 줄.
- **구현 메모**: `src/lib/saju/kst-offset.ts` 신설 — zdump 로 추출한 tzdata Asia/Seoul 전환 28건 테이블. `fromKST()` 가 `kstWallToUTC()` 사용. `trace.tzAdjust` → factsheet cautions → 결과 UI ⚠ 줄. 단위 테스트 10건 + 골든 5건 추가 (총 102 green).
- **완료 기준**:
  - 골든 테스트 4건 추가: 1987-07-15 23:30(보정 시 22:30 → 亥시·같은 날짜, 미보정이면 子시·다음 날 일주), 1955-06-01 00:20(UTC+8:30 → 일주 전날), 1990-07-15 23:30(보정 없음 대조군), 1961-08-10 00:10(규칙 종료 직후).
  - `npx vitest run` 87 + 4 all green.
  - 1987-07-15 23:30 결과 화면에 보정 문구 노출.

### P0-2. 공개 공유 API 출생정보 제거 ✅ 완료
- **파일**: `src/app/api/saju/public/[id]/route.ts:20`, `src/app/saju/view/[id]/page.tsx`
- **변경**: select 에서 `birth_year, birth_month, birth_day, birth_hour, birth_minute, birth_sex, birth_longitude, birth_name` 제거. 뷰 페이지가 쓰던 출생 필드는 `chart` 스냅샷(P0-4)의 일주·오행으로 대체. 이름은 "○○의 사주" 대신 일주 한자로.
- **구현 메모**: 발견 — 014 정책이 `USING(true)` 라 anon 키로 PostgREST 직접 조회 시 전 회원 출생정보가 열려 있었다. 016 에서 anon 컬럼 GRANT 로 차단. 공개 API 는 service client 로 읽고 안전 필드만 반환(`lib/saju/reading-public.ts`). OG 는 일주·오행 파라미터로만 생성.
- **완료 기준**: `curl /api/saju/public/<id> | jq 'keys'` 에 `birth_*` 없음. 공유 뷰 렌더 정상. OG 이미지(`api/saju/og`)가 이름을 쓰면 제거.

### P0-3. 캐시 미스 → DB 폴백 ✅ 완료 (reading). compat 은 P2-5 에서 저장이 생긴 뒤 적용
- **파일**: `src/app/api/saju/reading/route.ts` (캐시 확인 블록 `redis.get` 직후), `src/app/api/saju/compat/route.ts` 동일
- **변경**: Redis 미스이고 로그인 유저면 `saju_readings` 에서 `(user_id, cache_key)` 로 `ai_sections` 조회 → 있으면 그것을 반환하고 Redis 에 재적재(re-warm). `refresh=true` 는 폴백 건너뜀.
- **완료 기준**: Redis 키 삭제 후 같은 요청 → LLM 호출 없이(로그에 `[cache] db-fallback`) 동일 sections 반환. usage 로그에 토큰 0.

### P0-4. 원국 스냅샷 저장 (코멘트 ⑧) ✅ 완료
- **파일**: `supabase/016-saju-chart-snapshot.sql`, `reading/route.ts` `saveReading()`, `readings/[id]/route.ts`, `public/[id]/route.ts`, `src/components/saju-page.tsx` (결과 렌더)
- **변경**:
  - `saju_readings` 에 `chart JSONB`(연·월·일·시 `{stem,branch,gz}`, `daeun[]` 시작 나이·방향, `bodyStrength`, `geokGuk`, `yongsin`), `engine_version TEXT`(= `FACTSHEET_VERSION`) 추가.
  - 저장 시 채움. 이력에서 열 때 **저장된 chart 로 렌더**. 동시에 현재 엔진으로 재계산해 4주 gz 가 다르면 상단에 "계산 규칙이 업데이트됐어. 최신 계산으로 다시 보기" 배너(다시 풀이받기 = 크레딧 소모 경로).
- **완료 기준**: 마이그레이션 멱등(`IF NOT EXISTS`). 이력 열람 시 네트워크에 `/api/saju/reading` 호출 없음. 테스트: `engine_version` 다른 row 를 넣고 배너 노출 확인.

### P0-5. 모델 단일화 + 프롬프트 캐시 + 비용 로그 ✅ 구현 완료 — 캐시 적중 실측은 Anthropic 크레딧 충전 후 (`[saju usage]` 로그)
- **파일**: `reading/route.ts` (`callLLM`, `buildPrompt`), `compat/route.ts`, `src/lib/saju/compat.ts` `buildCompatPrompt`
- **변경**:
  - 모델을 `claude-sonnet-5` 로 통일. `tier` 파라미터는 스키마 호환을 위해 남기되 모델 분기 제거. `output_config: { effort: 'medium' }`.
  - system 을 **불변부**(페르소나·규칙 1~12·섹션 정의)만 남기고 `cache_control: {type:'ephemeral'}` 부여. 이름·현재 대운·cautions·concern 은 user 메시지 앞부분으로 이동. 타입별 system 은 4종이므로 캐시 4개.
  - 응답 `usage`(input / cache_read / cache_creation / output) 를 `console.info('[saju usage]', …)` 로 남긴다. Vercel 로그로 1주 실측.
- **구현 메모**: `src/lib/saju/llm.ts` 공통 호출(Sonnet 5, effort medium, system cache_control, usage 로그+추정 비용). buildPrompt 를 불변 system / 사용자별 user 로 분리 (이름·대운·모순규칙·주의·고민·오늘일진 전부 user 로).
- **완료 기준**: 같은 타입 요청 2회 연속 → 2회차 `cache_read_input_tokens > 0`. (미달이면 system 이 캐시 최소 길이 미만이라는 뜻 — 섹션 정의를 system 으로 더 옮긴다.) 4타입 × 2차트 샘플 출력이 기존 Haiku 출력보다 구체적인지 눈으로 비교해 `docs/saju-verification-log.md` 에 기록.

---

## P1. 유입 — 지나가다 써보게

### P1-1. 비로그인 미리보기 (0단) ✅ 완료
- **파일**: `src/app/saju/[type]/page.tsx` (redirect 제거), `src/app/saju/compat/page.tsx` (동일), 신규 `src/app/api/saju/chart/route.ts`, `src/components/saju-page.tsx` (`buildCoreDesc` 재사용, 현재 710행)
- **변경**:
  - `POST /api/saju/chart`: 입력 → `calcSajuServer` + `buildFactSheet` 까지만. LLM 없음. 응답: 4주·오행 비율·일주 카드 데이터·`buildCoreDesc` 입력값·해당 타입의 **섹션 제목 배열**(본문 없음). IP 레이트리밋 20회/분.
  - 비로그인 결과 화면: 원국 8자 + 일주 카드 + 오행 그래프 + 핵심 2문장 + **블러 처리된 섹션 제목 목록** + CTA "전체 풀이 보기 (가입하면 1회 무료)".
  - 폼은 이미 `sessionStorage 'saju:form'` / `'saju:pending-compute'` 에 저장된다. CTA → `/auth/login?next=/saju/{type}` → 돌아오면 `pending-compute` 를 읽어 **재입력 없이 자동 요청**. 이 경로가 실제로 작동하는지 확인하고 안 되면 고친다.
- **구현 메모**: 원국 계산은 이미 클라이언트 엔진(seolgi.json)이 하므로 `/api/saju/chart` 는 만들지 않았다(불필요). `[type]/page.tsx` redirect 제거 + `loggedIn` prop. AI 탭에 `PreviewGate`(섹션 제목 블러 + CTA). CTA 가 `saju:pending-compute` 에 출생정보를 넣고 로그인 → 복귀 시 기존 로직이 자동 계산. reading API 는 비로그인 401.
- **완료 기준**: 시크릿 창에서 `/saju/full` → 폼 → 미리보기까지 **로그인 없이 3탭**. 로그인 후 폼 재입력 0회. `/api/saju/chart` 는 Anthropic 호출 없음.

### P1-2. 궁합도 비로그인 입력 허용 ✅ 완료
- **파일**: `src/components/saju-compat-page.tsx`
- **변경**: A·B 입력과 `compareCharts()` 기반 등급·합충 요약(LLM 없음)은 비로그인 허용. AI 문장부터 로그인. 초대 링크 생성 버튼은 P2-5 에서.
- **완료 기준**: 비로그인으로 두 명 입력 → 등급 + "끌리는 이유/부딪히는 이유" 제목 노출.

### P1-3. 계측 ✅ 구현 완료 — GA4 DebugView 확인은 배포 후
- **파일**: 신규 `src/lib/analytics.ts` (`sendGAEvent` from `@next/third-parties/google` 래핑), 호출부 8곳
- **이벤트**: `saju_form_start`, `saju_form_submit{type,logged_in}`, `saju_preview_view{type}`, `saju_login_prompt{type}`, `saju_reading_view{type,cached}`, `saju_share_click{type}`, `saju_credit_zero{type}`, `saju_invite_create` / `saju_invite_accept`
- **구현 메모**: `src/lib/analytics.ts` `track()` (sendGAEvent 래핑). form_start/submit/preview_view/login_prompt/reading_view/share_click 배선. credit_zero·invite_* 는 P2 에서.
- **완료 기준**: GA4 DebugView 에서 8개 이벤트 확인. 퍼널 탐색 보고서 1개 저장(폼 시작 → 제출 → 미리보기 → 로그인 → 풀이).

---

## P2. 크레딧·초대 — 결제 없는 성장 루프

### P2-1. 크레딧 원장 (Supabase) ✅ 완료 — `supabase/017-saju-credits.sql` (테이블 3 + RPC 5, SETUP.sql 병합). 로컬 Postgres 멱등 재실행 검증은 DB 접근 가능할 때
- **파일**: `supabase/017-saju-credits.sql`
- **주의**: `009-credit-events.sql` 은 정치 플랫폼의 감경 이벤트 테이블이다. **재활용 불가.** 새로 만든다.
- **스키마**:
  ```
  saju_credits        (user_id PK → auth.users, balance INT DEFAULT 0, free_used BOOLEAN DEFAULT false,
                       today_last_date DATE, streak_count INT DEFAULT 0, streak_last_date DATE, updated_at)
  saju_credit_events  (id, user_id, delta INT, reason TEXT CHECK IN
                       ('signup','share_signup','invite_accept','daily_streak','reading','refresh','admin'),
                       ref_id TEXT, created_at)
  saju_referrals      (referred_user_id PK, referrer_user_id, rewarded BOOLEAN DEFAULT false, created_at)
  RPC consume_saju_credit(p_reason TEXT, p_ref TEXT) → {ok, balance}   -- SECURITY DEFINER, 원자적
  RPC grant_saju_credit(p_user UUID, p_delta INT, p_reason TEXT, p_ref TEXT)  -- service_role 전용
  ```
  - 가입 시 row 생성은 `auth/callback/route.ts` 에서 upsert (balance 0, free_used false). "무료 1회" 는 balance 가 아니라 `free_used=false` 로 표현한다(획득 크레딧과 섞이지 않게).
  - RLS: 본인 select 만. insert/update 는 RPC 경유.
- **완료 기준**: `SETUP.sql` 에 017 병합. 동시 요청 2개가 balance 1 을 두 번 깎지 못함(RPC 내 `FOR UPDATE`). 로컬 Postgres 로 검증.

### P2-2. 라우트를 원장으로 전환 + 日 매일 무료 (코멘트 ⑨) ✅ 완료 — `src/lib/saju/credits.ts` 한 곳에 규칙. reading·compat 라우트 전환, LLM 실패 시 환불, 402 에 `earn`
- **파일**: `reading/route.ts` (`checkDailyChartCap` 제거), `compat/route.ts` (Redis 캡 블록 제거), 신규 `src/lib/saju/credits.ts` (서버 헬퍼)
- **규칙** (`credits.ts` 한 곳에):
  ```
  이미 본 것 (saju_readings 에 (user, cacheKey) 있음, refresh=false) → 소모 없음
  type=today 이고 today_last_date != 오늘(KST)             → 소모 없음, today_last_date 갱신, streak 처리
  free_used=false                                          → free_used=true, 소모 없음
  balance>0                                                → consume (reason=reading|refresh)
  그 외                                                    → 402 { error:'credit', balance:0, earn:[...] }
  어드민(SAJU_ADMIN_USER_ID)                                → 항상 통과
  ```
  - 궁합(compat)도 같은 헬퍼. 초대 경유(P2-5)는 소모 없음.
- **완료 기준**: 신규 계정 시나리오 테스트(vitest, supabase mock): 命 1회 무료 → 緣 402 → 日 매일 통과 → 다음날 日 통과 → 같은 날 日 2회째 402. 응답 402 에 `earn` 배열(획득 방법 3종) 포함.

### P2-3. 크레딧 UI ✅ 완료 — `GET /api/saju/credits`, 랜딩 `CreditBadge` 3상태, 로그인 모달 제거, `CreditZeroPanel`(인라인, 획득 3줄 + 초대/오늘 바로가기)
- **파일**: `src/components/saju-cards.tsx` (`DailyFree` 컴포넌트 → `CreditBadge`), 신규 `GET /api/saju/credits`, `saju-page.tsx` 402 처리
- **변경**:
  - 랜딩 배지: "무료 1회 남음" / "크레딧 N" / "오늘의 사주 오늘 무료" 3상태.
  - 402 시 결과 영역에 **제목·첫 문장 블러 + 획득 안내 3줄**(공유 링크 복사 버튼 포함). 모달 금지 — 인라인.
  - 로그인 모달 문구 "하루 4회" → "가입하면 1회 무료, 오늘의 사주는 매일 무료".
- **완료 기준**: 402 → 공유 링크 복사까지 1탭. 모바일 375px 에서 블러 카드 4개가 첫 화면에 보임.

### P2-4. 획득 3종 ✅ 완료 — share_signup(공유 뷰 `saju_ref` 쿠키 → 콜백에서 referral 기록 → 첫 풀이 완료 시 `maybeRewardReferrer`, same_ip 미지급) / invite_accept(수락 시 양쪽 +1) / daily_streak(`saju_touch_today` RPC 7일 → +1)
- **share_signup** — 공유 URL(`/saju/view/[id]?ref=<referrer 8자>`, OG 카드 링크 포함)로 진입 시 쿠키 `saju_ref` 30일. `auth/callback` 에서 `saju_referrals` insert. 피추천인이 **첫 풀이를 완료**(`saveReading` 성공)한 시점에 추천인 +1, `rewarded=true`. 같은 IP 해시(`x-forwarded-for` sha256 앞 16자)를 `saju_referrals.ip_hash` 에 남기고 추천인과 같으면 미지급.
- **invite_accept** — P2-5 에서 양쪽 +1.
- **daily_streak** — `credits.ts` today 경로에서 `streak_last_date` 가 어제면 `streak_count+1`, 아니면 1. 7 도달 시 +1 하고 0 으로 리셋.
- **완료 기준**: 세 경로 각각 `saju_credit_events` 에 row 1개, balance +1. 추천인 자기 IP 로 가입 → 미지급 row(`rewarded=false`, 사유 로그).

### P2-5. 궁합 초대 링크 (코멘트 ③ 핵심) ✅ 완료 — 018 마이그레이션, invite create/get/preview/accept 4 라우트, `/saju/compat/i/[token]` 페이지 + 동적 OG(`variant=invite`, 1200×630), `hooks.ts` 템플릿 50개(테스트), 궁합 페이지 초대 모드 + 관계 칩 + 저장 리딩 뷰(`/saju/compat/[id]`) + 삭제
- **파일**: `supabase/018-saju-invites.sql`, 신규 `POST /api/saju/compat/invite`, `GET /api/saju/compat/invite/[token]`, `POST /api/saju/compat/invite/[token]/accept`, 신규 페이지 `src/app/saju/compat/i/[token]/page.tsx`, `saju-compat-page.tsx` 에 "상대에게 링크 보내기" 모드
- **흐름**:
  1. 로그인한 A 가 자기 정보만 입력 → "링크 보내기" → `saju_invites(token, inviter_id, person_a JSONB, status='pending', expires_at=+7d)` → 링크 + OG 카드("○○이 너와의 궁합이 궁금하대").
  2. B 가 링크 열면 **로그인 없이** 자기 정보 입력 폼 (A 의 정보는 안 보임. 일주 한자 정도만).
  3. B 입력 → `compareCharts()` 기반 등급·요약을 미리보기(0단) → "결과 보기" → 로그인(가입) → `accept`: `person_b` 저장, `status='accepted'`, **compat 리딩을 A·B 양쪽 `saju_readings` 에 저장**(같은 cacheKey → LLM 1회), 양쪽 +1 크레딧(`invite_accept`), A 에게 이력에 "○○이 수락했어" 표시.
  4. 초대 경유 궁합은 **양쪽 모두 소모 없음**(코멘트: "상대방이 자기 정보 입력했을 때 무료로").
- **초대 카드 (동적 OG, 사전 제작 없음)**:
  - `/saju/compat/i/[token]` 의 `generateMetadata` 가 invite row 를 읽어 제목·설명·`og:image` 를 **요청 시점에** 만든다. 카카오톡·인스타 DM·iMessage 크롤러는 이 메타만 읽으므로 JS 없이 서버 렌더가 필수(기존 `view/[id]` 패턴 그대로).
  - 이미지는 기존 `GET /api/saju/og`(edge, `@vercel/og`, 로컬 폰트) 에 `invite=<token>` 모드 추가. 1200×630 가로 변형 1종 추가(카톡 미리보기 비율). 캐시 헤더 `s-maxage=86400`(토큰당 URL 이 고유하므로 캐시 충돌 없음).
  - 카드 내용 3요소 — 전부 엔진 데이터, LLM 없음:
    1. A 의 일주 한자 + `DAY_MASTER_PROFILE[stem].keyword` 1개 ("丙戌 · 불꽃처럼 먼저 다가가는")
    2. 후킹 한 줄 — A 의 배우자성 오행·십신에서 템플릿 생성 ("이 사람은 木 기운의 상대에게 끌려. 너는 어떤 기운일까?"). 템플릿은 일간 10 × 배우자성 5 = 50개를 `src/lib/saju/hooks.ts` 에 상수로.
    3. CTA 텍스트 "생년월일만 넣으면 둘의 궁합이 열려"
  - 이름은 A 가 입력했을 때만 "○○이" 형태로. 생년월일시는 카드·메타 어디에도 넣지 않는다.
  - **후킹 문장에 LLM 안 씀 (결정).** 템플릿 50개로 고정. `hooks.ts` 는 순수 함수라 단위 테스트로 50개 전부 커버.
  - (선택) 카카오 JS SDK `Share.sendDefault` 피드 템플릿 — 이미지 + 버튼 "내 정보 넣고 궁합 보기". JavaScript 키는 개인 계정으로 발급 가능. OG 스크랩보다 버튼이 붙어 전환이 낫지만 SDK 로드 비용이 있어 P3 에서.
  - **완료 기준**: 카카오 디벨로퍼스 "링크 미리보기 확인" 도구에서 초대 URL 이 제목·후킹·이미지 3요소로 보임. 이미지 응답 < 500ms. B 랜딩 화면이 같은 3요소 + 입력 폼.
- **어뷰징**: 같은 계정이 자기 초대 수락 불가. 초대 1건당 1회 수락. 만료 7일. A 의 하루 초대 생성 10건 제한.
- **개인정보**: B 의 정보는 A 에게 "일주·오행·결과"만 보이고 생년월일시는 안 보임(역방향도 동일). 고지 문구 + 삭제 시 양쪽 reading 의 상대 필드 null.
- **완료 기준**: 시크릿 창 B 시나리오 — 링크 → 입력 → 미리보기 → 가입 → 결과까지 **탭 5회 이내, 재입력 0회**. A 이력에 결과 등장. 양쪽 balance +1. Anthropic 호출 1회.

### P2-6. 월 비용 킬스위치 ✅ 완료 — `src/lib/saju/spend.ts` (`SAJU_MONTHLY_CALL_LIMIT`, 기본 3000 ≈ 월 $40~120, 실패 시 decr, 80% 경고), 503 `monthly_cap`
- **파일**: `src/lib/saju/credits.ts` 또는 신규 `src/lib/saju/spend.ts`, `reading/route.ts`·`compat/route.ts` LLM 호출 직전
- **변경**: Redis `saju:spend:{YYYYMM}` INCR (LLM 실제 호출 시만). `SAJU_MONTHLY_CALL_LIMIT` env(기본 3000 — 2026-09-17 결정. 여기 닿으면 사업자·PG 검토 시점). 초과 시 503 `{error:'monthly_cap'}` + UI "이번 달 준비된 풀이가 다 나갔어. 다음 달 1일에 다시 열려". 어드민 면제. 80% 도달 시 `console.warn` 1회.
- **완료 기준**: env 를 3 으로 놓고 4번째 호출이 503. 캐시 히트·DB 폴백·미리보기는 카운트 안 됨.

---

## P3. 사용성·타입 특화

### P3-1. 日 오늘의 사주 — 매일 볼 수 있는 길이로 ✅ 완료 — 프롬프트 3섹션(첫 문장 "에너지 N/5")·토큰 900, `TodayCards` 3열 카드 + 에너지 점 게이지 + 연속일수, 프로필 있으면 `/saju/today` 진입 즉시 계산(2탭), 랜딩 日 카드 "오늘 무료" 뱃지. p50 응답시간은 배포 후 실측
- **파일**: `reading/route.ts` (`TOKEN_BUDGET.today` 1500 → 900, today 섹션 4 → 3: 오늘 에너지 한 줄 + 집중 + 조심), `saju-page.tsx` today 결과를 **카드 3장 한 화면**, `saju-cards.tsx` 日 카드에 "오늘 무료" 뱃지
- **완료 기준**: 로그인 상태에서 랜딩 → 日 결과까지 **2탭**(프로필 프리필 + 자동 제출). 375px 에서 스크롤 없이 3카드 노출. 응답 시간 p50 < 4초(Sonnet 5, 900토큰).

### P3-2. 타입 간 딥링크 + 命 티저화 ✅ 완료 — full 섹션 2·3 을 2문장으로 제한(상대 유형·타이밍은 緣·財로), `NextReadings` 5타입 매핑(命→緣·財 / 緣→合·日 / 財→命·日 / 日→合·命 / 合→內 사주)
- **파일**: `reading/route.ts` full 섹션 정의(2·3번을 2문장 요약으로 지시), `saju-page.tsx` 결과 하단 "다음으로 볼 것" 컴포넌트
- **규칙**: 命 결과 → 緣·財 링크 / 緣 결과 → 合 링크("지금 만나는 사람이 있다면") / 財 결과 → 命·日 / 日 결과 → 合(오늘의 궁합, P3-4) / 合 결과 → 상대의 命.
- **완료 기준**: 5개 결과 화면 모두 하단 링크 존재. 링크 클릭 시 프로필 프리필로 재입력 0회.

### P3-3. 타이밍 타임라인 (緣·財) ✅ 완료 — `TimingTimeline`: 대운 8개 + 세운 5년을 배우자성(緣) / 재·관·식상(財) 기준으로 표시. loveFocusSignals 와 같은 십신 규칙. 문장-타임라인 불일치 0건 확인은 샘플 수집 후
- **파일**: 기존 대운 타임라인 컴포넌트(`saju-page.tsx` 내) 재사용, factsheet `daeun[]`·`seyun[]` 데이터
- **변경**: 緣 = 배우자성 오행이 들어오는 대운·세운을 점으로, 財 = 재성·관성 대운을 점으로. LLM 문장과 별개로 엔진 데이터로 그린다(문장과 어긋나지 않게 팩트시트 focusSignals 와 같은 규칙 사용).
- **완료 기준**: 타임라인 점과 LLM 본문의 연도가 불일치하는 케이스 0건(샘플 10차트).

### P3-4. 궁합 프리셋 + 오늘의 궁합 ✅ 완료 — relation 4종(연인·친구·동료·가족) 페르소나 + 캐시 키 분리, `TodayCompatLine`: 저장된 궁합 상대의 일지와 오늘 일진의 합·충으로 한 줄 (없으면 초대 링크)
- **파일**: `compat.ts` `buildCompatPrompt` 페르소나 분기(연인/친구/동료/가족), `compat/route.ts` `relation` 파라미터, 日 결과에 "저장된 궁합 상대와 오늘" 1줄(상대 저장 = 결정 ③)
- **완료 기준**: relation 4종 캐시 키 분리. 日 결과에 상대 있으면 1줄 추가, 없으면 "궁합 보러 가기".

### P3-5. 폼·모바일 사용성 점검 (코멘트 "사용성 안 좋으면 이탈") ◐ 코드 항목 완료 / **실기기 캡처·LCP 측정은 사람 필요** — 숫자 inputMode·시간 미상 1탭·로그인 후 폼 복원·이력 경로 뒤로가기는 기존/신규 구현으로 충족. 10초 초과 시 안내 문구 추가
- **체크리스트** (375px, 3G 스로틀):
  - 첫 진입 → 폼 첫 입력까지 LCP < 2.5초
  - 생년월일 입력이 네이티브 date picker 인지, 시간 미상 토글 1탭인지
  - 로그인 후 폼 복원 100%
  - 결과 로딩 중 스켈레톤(이미 있음) + 10초 초과 시 안내
  - 뒤로가기로 결과 사라지지 않음(이력 경로)
- **완료 기준**: 체크리스트 전부 통과. 실기기 2대(iOS Safari, Android Chrome) 캡처를 `docs/saju-verification-log.md` 에.

---

## P4. 검증 — P1 부터 병행

### P4-1. KASI 일주 전수 대조 ◐ 스크립트 완료 / **실행은 `DATA_GO_KR_API_KEY` 확보 후** — `scripts/verify-day-pillar-kasi.ts` (월 단위 API 호출, `scripts/.cache/kasi/` 캐시). 키 없이 실행 시 명확한 안내로 종료 확인
- **파일**: 신규 `scripts/verify-day-pillar-kasi.ts`, 결과 `docs/saju-verification-log.md`
- **변경**: 공공데이터포털 음양력 API(`LrsrCldInfoService`, 키는 크롤러 `DATA_GO_KR_API_KEY` 재사용)로 1900~2050 매일 `일진` 조회 → `engine.ts` 일주와 비교. 호출 제한이 있으면 월 단위 배치로 며칠 나눠 돌린다. 결과를 JSON 으로 캐시해 재실행 시 API 재호출 없음.
- **완료 기준**: 불일치 0건. 있으면 offset 이 아니라 특정 날짜인지 분류.

### P4-2. 절기·음력 대조 ◐ 스크립트 완료 / 실행은 키 확보 후 — `verify-seolgi-kasi.ts`(±1분, 당시 표준시 규칙으로 UTC 환산), `verify-lunar-kasi.ts`
- **파일**: `scripts/verify-seolgi-kasi.ts`, `scripts/verify-lunar-kasi.ts`
- **변경**: `seolgi.json` 5304건 vs KASI 24절기 특일 API 절입 시각(±1분 초과 리스트업). `lunar.ts` vs API 음양력 변환 1900~2050 전수(윤달 포함).
- **완료 기준**: 절기 ±1분 초과 0건(있으면 월주 경계 케이스로 골든 테스트 추가). 음력 불일치 0건.

### P4-3. LLM 통변 자동 QA ◐ 스크립트 완료 / 실행은 Anthropic 크레딧 후 — `scripts/saju-qa.ts` (a~e 검사, 임베딩 대신 문자 2-gram 코사인) + `scripts/collect-qa-samples.ts` (4타입 × 10차트, 프롬프트 빌더를 `lib/saju/prompt.ts` 로 분리해 공유)
- **파일**: 신규 `scripts/saju-qa.ts`
- **검사**: (a) 신강 차트 출력에 "인성 보강" 계열 문구 → fail. 신약에 "식상 활성" → fail. (b) 팩트시트 `notableSignals` 에 없는 신살명 등장 → fail. (c) 금지 표현("분명 잘 될", "걱정 마" 등 규칙 11) → fail. (d) 연도 미기재 섹션(규칙 7) → warn. (e) 차트 20개 출력 임베딩 코사인 > 0.9 쌍 → 몰개성 warn.
- **완료 기준**: 4타입 × 10차트 = 40건 중 fail 0, warn 5 이하. 결과 표를 verification-log 에.

### P4-4. 블라인드 QA + 수동 교차검증 ⏳ **사람 필요** — `docs/saju-verification-log.md` 에 표 준비됨
- 지인 3명: 본인 풀이 + 타인 풀이 2개 섞어 "내 것 고르기". 2/3 이상 정답이면 통과.
- 대운 교운나이·순역 8건 + 야자시 10건을 포스텔러·정해사주·사주J 와 대조. 격국·용신 20건은 서적 예제. 일치율과 불일치 사유("학파 차이" vs "버그") 분류.
- **완료 기준**: 로그 파일에 케이스별 출처·결과. 버그로 분류된 건은 골든 테스트로 승격.

---

## 3. 순서 (실행 큐)

| 주차 | 태스크 | 비고 |
|---|---|---|
| 1 | P0-1 → P0-2 → P0-4 → P0-3 → P0-5 | P0-4 가 P0-2 의 대체 데이터 제공. P4-1 스크립트 병행 시작 |
| 2 | P1-1 → P1-3 → P1-2 | 계측을 미리보기와 같이 배포해야 퍼널 첫 수치가 나온다 |
| 3 | P2-1 → P2-2 → P2-3 → P2-6 | 킬스위치 없이 크레딧 열지 않는다 |
| 4 | P2-5 → P2-4 | 초대가 먼저. 공유 보상은 초대 인프라 재사용 |
| 5 | P3-1 → P3-2 → P3-5 | 日 압축이 매일 사용자 리텐션의 첫 실험 |
| 6 | P3-3 → P3-4 → P4-3 → P4-4 | |

각 주 끝에 **비용 로그(P0-5)와 GA4 퍼널(P1-3)을 읽고** 다음 주 순서를 조정한다. 특히 3주차 후 "무료 1회 → 402 → 공유 클릭" 전환율이 결제 도입 판단 근거가 된다.

## 4. 안 하는 것 (이번 플랜 범위 밖)

- 결제·PG·사업자등록 (⑥)
- 광고 (상쇄 효과가 회당 비용의 5% 미만)
- 웹푸시·알림톡 (P3-1 후 日 재방문율 보고 결정)
- 유료 모델 분기(`tier=paid` 프롬프트) — 파라미터만 남김
- SchoolProfile UI, 월운·일운 확장 (M2 잔여)

## 4-1. 구현 결과 요약 (2026-09-16)

| 페이즈 | 상태 |
|---|---|
| P0 | ✅ 5/5 (P0-5 캐시 적중 실측만 크레딧 후) |
| P1 | ✅ 3/3 (GA4 DebugView 확인은 배포 후) |
| P2 | ✅ 6/6 |
| P3 | ✅ 4/5 + P3-5 실기기 점검은 사람 |
| P4 | ◐ 스크립트 4/4 작성, 실행은 API 키·크레딧 후 / P4-4 사람 |

배포 전 체크: **`supabase/UPGRADE-016-018.sql` 전체를 SQL Editor 에 붙여넣어 실행** (SETUP.sql 은 신규 DB 전용 — 데이터가 있으면 사전 점검에서 중단됨), Vercel 환경변수에 `SUPABASE_SERVICE_KEY`·`SAJU_MONTHLY_CALL_LIMIT` 추가, Anthropic 크레딧 충전. 검증: `npm run typecheck` · `npm test`(105) · `npm run build` 모두 통과 (2026-09-16).
남은 사람 작업: P3-5 실기기 캡처, P4-4 블라인드 QA·외부 만세력 대조, 후킹 템플릿 50개 톤 검토(`src/lib/saju/hooks.ts`).

## 4-2. 풀이 밀도·가독성 개편 (2026-09-17)

경쟁 서비스(사주아이) 리포트 3종과 결과 화면을 대조한 뒤 "풀이가 단순하고 화면이 불친절하다" 를 두 갈래로 나눠 고쳤다.

**풀이 (LLM)**

| | 전 | 후 |
|---|---|---|
| 종합(full) 섹션 | 6개 (연애·직업은 "딱 2문장") | 10개 — 총평·기질·오행·강점·약점·관계·일과 돈·올해·내년·처방 |
| 본문 구조 | "4~6문장" 자유 산문 | 3문단 고정 (현상 → 원국 근거 → 이번 주 행동 1가지), 섹션당 240~320자 |
| 섹션 제목 | 기능 라벨 | `label`(고정 카테고리) + `title`(원국에서 나온 후킹 한 줄) 로 분리 |
| 개운법 | 없음 | 처방 섹션 끝에 `색 · 숫자 · 방향 · 오늘 할 것` 한 줄 (용신 오행 기준) |
| 궁합 | 4섹션 | 6섹션 (케미·속도·갈등·영향·시너지·오래가려면), 첫 title 이 점수 아래 캐치프레이즈로 |

**화면**

- 풀이 섹션 카드: `01 총평` 캡션 + 후킹 제목(19px) + 문단 분리 렌더. 처방 한 줄은 칩으로 분리.
- 섹션 목차 칩 — 눌러서 해당 섹션으로 스크롤.
- 입력한 고민을 결과 상단에 되돌려 보여줌(`ConcernNote`).
- 로딩 화면에 "N편을 쓰는 중" + 나올 섹션 목록 + 예상 소요.
- 미리보기 게이트·크레딧 소진 패널에 라벨 + 한 줄 설명(`SECTION_SUBTITLES`).
- 하단 액션: 처음으로 · 카드 공유 · 다시 풀이받기.

**같이 고친 것**

- `lib/saju/json-repair.ts` — 본문이 여러 문단이 되자 모델이 JSON 문자열 안에 날 줄바꿈을 넣어 `JSON.parse` 가 죽었다(502). 문자열 내부 제어문자만 이스케이프 + 절단 복구를 한 곳으로 모으고 테스트 8건.
- `max_tokens` 헤드룸 1.3 → 1.45 (첫 실측에서 `stop=max_tokens` 로 잘림).
- `scripts/saju-qa.ts` — 타이밍 섹션 판정을 제목 정규식 → `label` 기준으로. 신강/신약 모순 규칙에 부정 맥락 가드 추가("인성을 더 채우면 독" 을 권장으로 오판하던 false positive).
- `FACTSHEET_VERSION` 2.1.0 → 2.2.0, `COMPAT_PROMPT_VERSION` 1.1 → 1.2 (기존 캐시·저장분 무효화).

**비용 영향** — full 출력 3,000 → 약 5,100토큰. Sonnet 5 기준 회당 약 $0.033 → $0.053 (실측 1건, prompt cache 적중 시). 월 3,000회 킬스위치면 상한이 약 $100 → $160 수준. 한도 재검토 필요.

**남은 것** — 로그인 상태의 실제 풀이 화면은 미확인(로컬에서 로그인 불가). 배포 후 full·love·career·today·compat 각 1건씩 눈으로 확인할 것.

## 5. Ralph 루프로 돌릴 때

- SPEC 단위 = 위 태스크 1개. 완료 기준이 곧 검증 명령.
- 워커 착수 전 필수: `npx vitest run` 녹색, `npm run build` 통과.
- 마이그레이션(016·017·018)은 `supabase/SETUP.sql` 에도 병합하고 로컬 Postgres 로 멱등 재실행 확인(`supabase/README.md` 절차).
- 감독 검증: `git diff --stat` 로 태스크가 명시한 파일 밖을 건드렸는지, 완료 기준의 명령을 직접 재실행.
