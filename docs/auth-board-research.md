# 게시판 + 카카오 로그인 + 진영 선택 — 리서치 & 설계

> 2025-05-25 작성

## 1. 아키텍처 결정

### 최적안: Supabase Auth + Kakao OAuth + RLS

| 구성 요소 | 선택 | 근거 |
|-----------|------|------|
| 인증 | Supabase Auth + Kakao OAuth | 이미 Supabase 사용 중, SSR 패키지 설치됨 |
| 세션 관리 | middleware.ts + cookie | Next.js App Router 공식 패턴, getUser()로 토큰 검증 |
| 게시판 DB | Supabase (board_posts) | 동일 인프라, RLS로 보안 |
| 레이트리밋 | Upstash (@upstash/ratelimit) | 이미 패키지 설치됨, slidingWindow 사용 |
| 스팸 방지 | Honeypot + 시간 검증 + 레이트리밋 | CAPTCHA 없이 다층 방어 |

### 대안 (기각)

| 대안 | 기각 이유 |
|------|-----------|
| NextAuth.js | Supabase Auth와 중복, 불필요한 레이어 |
| 자체 JWT | 세션 관리 복잡도 증가, Supabase가 이미 해줌 |
| Firebase Auth | 인프라 이원화, Supabase와 충돌 |
| 닉네임+비밀번호 (현재) | 비밀번호 해싱이 클라이언트에서 됨, 보안 취약 |

## 2. Kakao OAuth 설정

### Kakao Developer Console

1. [developers.kakao.com](https://developers.kakao.com) 앱 생성
2. **REST API 키** = Supabase의 `client_id` (JavaScript 키 아님!)
3. **카카오 로그인 > 활성화 설정** ON
4. **Redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
5. **보안 > Client Secret** 생성 → Supabase의 `client_secret`
6. **동의항목**: `profile_nickname`, `profile_image` (이메일은 사업자 앱만 가능)

### Supabase Dashboard

- Authentication > Providers > Kakao > Enable
- REST API Key → Client ID
- Client Secret → Client Secret

### 주의사항

- `account_email` 스코프는 **사업자 인증 앱만** 사용 가능 (개인 개발자 = KOE205 에러)
- 민낯은 이메일 불필요 — 닉네임 + 프로필 이미지만 수집
- Kakao 닉네임은 변경 가능하므로 내부 user_id 기반 식별 필수

## 3. Next.js App Router + Supabase Auth 패턴

### 필수 파일

| 파일 | 역할 |
|------|------|
| `src/middleware.ts` | 모든 요청에서 토큰 갱신 (getUser() 호출) |
| `src/app/auth/callback/route.ts` | OAuth 코드 → 세션 교환 |
| `src/lib/supabase/server.ts` | 서버 컴포넌트/API용 (이미 있음) |
| `src/lib/supabase/client.ts` | 클라이언트 컴포넌트용 (이미 있음) |

### middleware.ts가 필수인 이유

Server Component는 쿠키를 **쓸 수 없음**. 토큰 만료 시 갱신된 토큰을 쿠키에 저장하려면 middleware에서 처리해야 함. 없으면 매 페이지 이동마다 로그아웃됨.

### getUser() vs getSession()

- `getSession()`: 로컬 쿠키만 읽음 (검증 없음, 위조 가능)
- `getUser()`: Supabase Auth 서버에 요청해서 토큰 유효성 검증
- **middleware에서는 반드시 `getUser()`** 사용

## 4. 게시판 설계

### 진영 태그 (홍/청/자유)

| 값 | 의미 | 색상 |
|----|------|------|
| `red` | 홍 (보수) | 빨강 계열 |
| `blue` | 청 (진보) | 파랑 계열 |
| `free` | 자유 | 회색/흰색 |

- 게시글 작성 시 **필수 선택**
- 게시판 목록에서 탭 필터로 분리
- 정치인 이름 태그는 선택사항 (자유 게시판이므로)

### 익명성 정책: 더쿠 모델

- **로그인 필수** (스팸 방지) + **표시는 익명** (자유 발언)
- DB에 `user_id` 저장 (밴/제재용)
- 프론트에서는 "익명" 또는 자동 생성 닉네임 표시
- user_id는 **절대 프론트에 노출하지 않음**

### 추천 시스템

- **추천만** (비추천 없음) — 정치 게시판에서 비추천은 집단 공격 도구가 됨
- 1인 1추천 (user_id 기반 중복 방지)
- 추천 N개 이상 = 인기글 승격

### 페이지네이션: 커서 기반

- 오프셋 기반은 페이지 깊어질수록 느려짐
- `created_at` + `id` 기반 커서
- 인덱스: `(created_at DESC, id DESC)`

## 5. DB 스키마

```sql
-- 유저 프로필 (Supabase Auth 확장)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  kakao_nickname TEXT,
  display_camp TEXT CHECK (display_camp IN ('blue', 'red', 'free')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 게시글
CREATE TABLE board_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  camp TEXT NOT NULL CHECK (camp IN ('blue', 'red', 'free')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  like_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 추천 (중복 방지)
CREATE TABLE board_likes (
  user_id UUID REFERENCES auth.users(id),
  post_id UUID REFERENCES board_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
```

## 6. 보안

### XSS 방지

- React JSX `{content}` 자동 이스케이프 — 별도 처리 불필요
- `dangerouslySetInnerHTML` 절대 사용 금지
- 링크 `href`에 유저 입력 시 `http://` / `https://` 시작만 허용

### SQL Injection

- Supabase JS 클라이언트는 PostgREST 경유 → 파라미터화 자동 적용
- 커스텀 RPC 함수에서 `EXECUTE` 사용 시 `USING $1` 필수

### 레이트리밋 (Upstash)

```
게시글 작성: 5건/10분 (slidingWindow)
추천: 30건/1분
제보: 3건/10분
```

### 스팸 방지 (CAPTCHA 없이)

1. **Honeypot**: 숨겨진 input 필드 — 봇만 채움
2. **시간 검증**: 3초 미만 제출 거부 (사람은 불가능)
3. **내용 검증**: URL 5개 이상 거부, 10자 미만 거부
4. **중복 검증**: 동일 내용 해시 → Redis에서 최근 중복 체크

## 7. UX 패턴

### 게시판 탭 구조

```
[전체] [홍] [청] [자유] [인기]
```

- 인기 = like_count >= N인 글
- 탭 전환 시 URL 파라미터 변경 (`/board?camp=red`)
- 기본값: 전체

### 글 작성 플로우

1. "글쓰기" 버튼 → 미로그인 시 카카오 로그인 유도
2. 로그인 후 → 진영 선택 (홍/청/자유) + 제목 + 내용
3. 제출 → 레이트리밋 체크 → Honeypot 체크 → 저장
4. 성공 → 게시판 목록으로 리다이렉트

### 모바일 우선

- 한국 정치 커뮤니티 사용자 70%+ 모바일
- 터치 타겟 44px 이상
- 무한 스크롤 (커서 기반)
