# 민낯 게시판 + 인증 구현 계획서

> 2025-05-25 작성 | 참고: `docs/auth-board-research.md`

## 전제조건 (시작 전 필수)

- [ ] Kakao Developer Console 앱 생성 + REST API 키 발급
- [ ] Kakao 로그인 활성화 + Redirect URI 등록
- [ ] Supabase Dashboard > Auth > Kakao Provider 활성화
- [ ] Upstash Redis 생성 + env 변수 등록 (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)

---

## Phase 1: 인증 인프라

### Step 1-1. DB 마이그레이션 ✅

**파일**: `supabase/migration-007-auth-board.sql`

```
user_profiles     — auth.users 확장 (kakao_nickname, display_camp, profile_image)
board_posts       — 기존 테이블 교체 (user_id FK, camp 태그, like_count)
board_likes       — 추천 중복 방지 (PK: user_id + post_id)
```

- 기존 `migration-006-board.sql`의 `board_posts` DROP 후 재생성 (데이터 없으므로 안전)
- RLS: 누구나 읽기, 로그인 유저만 쓰기, 본인 글만 삭제

### Step 1-2. Supabase Auth 미들웨어 ✅

**파일**: `src/middleware.ts`

- 모든 요청에서 `getUser()` 호출 → 토큰 자동 갱신
- 쿠키 읽기/쓰기 처리
- 정적 파일 제외 matcher

### Step 1-3. OAuth 콜백 라우트 ✅

**파일**: `src/app/auth/callback/route.ts`

- Kakao OAuth 코드 → Supabase 세션 교환
- 성공 시 `/` 리다이렉트, 실패 시 `/auth/login?error=true`

### Step 1-4. 유저 프로필 자동 생성 ✅ (migration-007에 트리거 포함)

**방식**: Supabase Database Trigger (SQL)

- `auth.users` INSERT 시 → `user_profiles` 자동 생성
- Kakao 닉네임은 `raw_user_meta_data->>'name'`에서 추출

---

## Phase 2: 로그인 UI

### Step 2-1. 로그인 페이지 재구현 ✅

**파일**: `src/app/auth/login/page.tsx`

- 카카오 로그인 버튼 → `supabase.auth.signInWithOAuth({ provider: 'kakao' })`
- 로그인 후 리다이렉트 경로 처리 (`next` 파라미터)
- 에러 상태 표시

### Step 2-2. 진영 선택 (최초 로그인 시) ✅

**파일**: `src/app/auth/setup/page.tsx`

- 카카오 로그인 직후 진영 미선택이면 이 페이지로 리다이렉트
- 홍(red) / 청(blue) / 자유(free) 3택
- 선택 후 `user_profiles.display_camp` 업데이트
- 이후 변경 가능 (마이페이지에서)

### Step 2-3. 네비게이션 로그인 상태 ✅

**파일**: `src/components/nav.tsx`

- 로그인 시: 진영 색상 dot + "로그아웃" 버튼
- 비로그인 시: "로그인" 버튼
- 서버 컴포넌트에서 `getUser()` 호출

---

## Phase 3: 게시판

### Step 3-1. 게시판 API ✅

**파일**: `src/app/api/board/route.ts` (재구현)

- `GET`: 커서 기반 페이지네이션 + camp 필터 + 인기글 필터
- `POST`: 로그인 검증 + 레이트리밋 + Honeypot + 저장

**파일**: `src/app/api/board/[id]/route.ts`

- `GET`: 상세 조회 + 조회수 증가
- `DELETE`: 본인 글 삭제 (user_id 검증)

**파일**: `src/app/api/board/[id]/like/route.ts`

- `POST`: 추천 토글 (있으면 취소, 없으면 추가)
- 레이트리밋 적용

### Step 3-2. 게시판 목록 페이지 ✅

**파일**: `src/app/board/page.tsx`

- 탭: `[전체] [홍] [청] [자유] [인기]`
- URL 파라미터: `/board?camp=red`
- 무한 스크롤 (커서 기반)
- 각 글: 진영 태그 + 제목 + 추천수 + 조회수 + 시간

### Step 3-3. 글 작성 페이지 ✅

**파일**: `src/app/board/write/page.tsx`

- 미로그인 → 카카오 로그인 유도
- 진영 선택 (홍/청/자유) — 필수
- 제목 + 내용 입력
- Honeypot 숨김 필드
- 제출 시간 검증 (3초 미만 거부)

### Step 3-4. 글 상세 페이지 ✅

**파일**: `src/app/board/[id]/page.tsx`

- 제목, 내용, 진영 태그, 작성일, 조회수
- 추천 버튼 (로그인 시만 활성)
- 본인 글이면 삭제 버튼
- 익명 표시 ("익명" 고정, user_id 노출 안 함)

---

## Phase 4: 보안 강화

### Step 4-1. 레이트리밋 ✅

**파일**: `src/lib/ratelimit.ts`

- Upstash slidingWindow
- 게시글: 5건/10분, 추천: 30건/1분, 제보: 3건/10분

### Step 4-2. 스팸 방지 ✅

- Honeypot 필드 (글 작성 폼)
- 제출 시간 검증 (폼 렌더 timestamp)
- 내용 검증 (URL 5개 이상, 10자 미만 거부)

### Step 4-3. RLS 정책 검증 ✅ (migration-007에 포함)

- board_posts: SELECT 전체 / INSERT 로그인 유저 / DELETE 본인만
- board_likes: SELECT 전체 / INSERT·DELETE 로그인 유저, 본인 것만
- user_profiles: SELECT 전체 / UPDATE 본인만

---

## 구현 순서 요약

```
Phase 1 (인증 인프라)
  1-1. DB 마이그레이션        ← 먼저 (테이블 없으면 아무것도 안 됨)
  1-2. middleware.ts           ← 세션 유지 필수
  1-3. OAuth 콜백              ← 로그인 완료 처리
  1-4. 프로필 자동 생성        ← DB 트리거

Phase 2 (로그인 UI)
  2-1. 로그인 페이지           ← 카카오 버튼 실제 동작
  2-2. 진영 선택               ← 최초 로그인 후 온보딩
  2-3. 네비 로그인 상태        ← 전역 UI 반영

Phase 3 (게시판)
  3-1. API (CRUD + 추천)       ← 백엔드 먼저
  3-2. 목록 페이지             ← 탭 + 무한 스크롤
  3-3. 글 작성                 ← 로그인 검증 포함
  3-4. 글 상세                 ← 추천 + 삭제

Phase 4 (보안)
  4-1. 레이트리밋              ← Upstash
  4-2. 스팸 방지               ← 다층 방어
  4-3. RLS 검증                ← 최종 점검
```

---

## 파일 변경 목록 (예상)

| 작업 | 새 파일 | 수정 파일 |
|------|---------|-----------|
| DB | `supabase/migration-007-auth-board.sql` | — |
| 미들웨어 | `src/middleware.ts` | — |
| 콜백 | `src/app/auth/callback/route.ts` | — |
| 로그인 | — | `src/app/auth/login/page.tsx` |
| 진영 선택 | `src/app/auth/setup/page.tsx` | — |
| 네비 | — | `src/components/nav.tsx` |
| 타입 | — | `src/types/index.ts` |
| API | `src/app/api/board/route.ts`, `[id]/route.ts`, `[id]/like/route.ts` | — |
| 게시판 | — | `src/app/board/page.tsx`, `write/page.tsx` |
| 상세 | `src/app/board/[id]/page.tsx` | — |
| 레이트리밋 | `src/lib/ratelimit.ts` | — |
| 회원가입 삭제 | — | `src/app/auth/signup/page.tsx` (삭제 또는 리다이렉트) |
