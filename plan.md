# 민낯 (minnat) — 구현 계획서

> "색안경 벗고, 팩트로 보는 정치"
> 도메인: minnat.kr
> 참고: /Users/sungmin/research.md

---

## Phase 1: MVP (스코어보드 + 이슈 뷰어)

### Step 1. 프로젝트 셋업 --- DONE

- [x] Next.js 15 (App Router) 프로젝트 생성
- [x] TypeScript + Tailwind CSS v4 + Framer Motion 설치
- [x] Supabase 클라이언트 설정 + 환경변수 (.env.local)
- [ ] Vercel 프로젝트 연결 + 자동 배포 설정 (수동 — 사용자 계정 필요)
- [ ] Cloudflare DNS 프록시 설정 (수동 — 도메인 구매 후)
- [x] 프로젝트 구조 생성:
  ```
  app/
  ├── page.tsx              # 메인 — 풀스크린 스플릿
  ├── layout.tsx            # dark-luxe 테마 레이아웃
  ├── issues/
  │   ├── page.tsx          # 이슈 목록
  │   └── [id]/page.tsx     # 이슈 상세
  ├── policies/
  │   └── page.tsx          # 논란 정책 탭
  ├── about/page.tsx        # 방법론 공개
  └── api/
      ├── scores/route.ts   # 점수 조회
      └── issues/route.ts   # 이슈 조회
  ```

### Step 2. DB 스키마 + Supabase 설정 --- PARTIAL (스키마 SQL 준비, Supabase 프로젝트 생성은 수동)

- [ ] 테이블 생성 (Supabase 대시보드에서 실행):
  - `parties` — 정당/진영
  - `politicians` — 정치인
  - `issues` — 이슈 (핵심 테이블)
  - `score_snapshots` — 일별 점수 캐싱
- [ ] RLS (Row Level Security) 정책 설정
- [ ] 시드 데이터 입력:
  - 정당 2개 (더불어민주당, 국민의힘)
  - 주요 정치인 20~30명

### Step 3. 메인 페이지 — 풀스크린 스플릿 UI --- DONE

- [x] taste-skill pack dark-luxe 스타일 참고
- [x] dark-luxe 스타일 기반 레이아웃 구현 (다크 배경, 네온 글로우)
- [x] 풀스크린 스플릿 컴포넌트 (split-screen.tsx):
  - 화면 전체를 파랑/빨강이 비율대로 분할
  - 경계선이 실시간 비율에 따라 이동 (Framer Motion spring)
  - 경계선 위에 퍼센티지 숫자 표시
  - 각 영역에 파랑/빨강 글로우 효과
- [x] 카테고리별 요약 카드 (category-summary.tsx)
- [x] 스크롤 다운 시 최근 이슈 타임라인 (reveal 애니메이션)
- [x] 반응형

### Step 4. 이슈 목록/상세 페이지 --- DONE

- [x] 이슈 목록 페이지 (issues-page.tsx):
  - 필터: 카테고리 / 진영 (issue-filter.tsx)
  - 정렬: 최신순 / 점수순
  - 각 이슈에 진영 색상 표시 + 점수 + 출처 (issue-card.tsx)
- [x] 이슈 상세 페이지 (issue-detail-page.tsx):
  - 제목, 요약, 카테고리, 심각도, 영향 범위
  - 점수 산출 근거 (공식 적용 결과 투명 공개)
  - AI 분석 근거 (왜 이 카테고리, 왜 이 심각도)
  - 출처 원문 링크 (필수)

### Step 5. 논란 정책 탭 --- DONE

- [x] `/policies` 페이지 (policies-page.tsx):
  - 점수 미반영 이슈 별도 표시
  - 안내 배너 (왜 점수 미반영인지 설명)
- [x] 메인 페이지에서 스크롤 하단에 논란 정책 섹션 배치
- [ ] 여론 온도계 (Phase 2에서 로그인 후 구현)

### Step 6. 데이터 수집 파이프라인

- [ ] Python 크롤러 작성 (별도 repo: `minnat-crawler`):
  - 국회 의안정보시스템 API 연동
  - SNU 팩트체크센터 크롤링
  - 주요 뉴스 RSS/API 크롤링 (연합뉴스, KBS, MBC, SBS)
  - 법원 판결문 RSS
- [ ] 전처리 파이프라인:
  - 중복 제거 (제목 유사도 > 0.85)
  - 정치인/정당 엔티티 추출
- [ ] Claude Haiku API 연동:
  - 카테고리 자동 분류
  - 심각도 판정
  - confidence score 산출 (< 0.7이면 관리자 검증 큐)
- [x] 점수 산출 엔진 (src/lib/score.ts):
  - 소스 임계값 검증 (Tier1-2 즉시, Tier3 교차검증, Tier4 미반영)
  - `점수 = 기본가중치 × 시간감쇠 × 심각도 × 영향범위`
  - 일별 score_snapshots 생성
- [ ] GitHub Actions cron 설정:
  - 국회 API: 매일 03:00
  - 팩트체크: 매일 09:00, 21:00
  - 뉴스: 6시간마다
  - 법원 판결: 매주 월요일
- [ ] 관리자 검증 큐:
  - AI 확신도 낮은 이슈 리스트
  - 승인/반려/수정 인터페이스 (간단한 admin 페이지)

### Step 7. 시드 데이터 수집

- [ ] 최근 6개월 주요 이슈 100건 수동 + 자동 수집
- [ ] 각 이슈 점수 산출 + 검증
- [ ] score_snapshots 생성 → 메인 페이지에 실제 데이터 반영

### Step 8. SEO + OG 이미지 + About --- DONE

- [x] @vercel/og로 동적 OG 이미지 생성 (api/og/route.tsx)
- [ ] JSON-LD 구조화 데이터 (실 데이터 연동 후)
- [x] sitemap.xml + robots.txt
- [x] `/about` 페이지:
  - 프로젝트 취지 (자정작용, 팩트 기반)
  - 점수 산출 방법론 전체 공개
  - 카테고리 정의 + 가중치 표
  - 소스 신뢰도 체계 설명
  - 핵심 원칙

### Step 9. 보안 설정 --- PARTIAL

- [ ] Cloudflare 설정 (수동 — 도메인 구매 후):
  - DNS Proxy 활성화
  - Bot Fight Mode ON
  - Under Attack Mode 준비
- [x] Next.js 보안 헤더 (next.config.ts):
  - CSP (Content Security Policy)
  - HSTS
  - X-Frame-Options: DENY
  - Permissions-Policy
- [x] API Rate Limiting 패키지 설치 (@upstash/ratelimit)
- [x] Supabase RLS 정책 (supabase/schema.sql)
- [x] 입력 검증: Zod 설치 완료

### Step 10. MVP 론칭

- [ ] 전체 테스트 (UI, 점수 정확성, 보안, 모바일)
- [ ] Vercel Production 배포
- [ ] Cloudflare 최종 확인
- [ ] 론칭

---

## Phase 2: 커뮤니티 (MVP 이후)

### Step 11. 인증 + 게시판

- [ ] 카카오 소셜 로그인 + Supabase Auth 연동
- [ ] 유저 테이블 (닉네임, 진영 선택: 홍/청/없음)
- [ ] 자유게시판 CRUD
- [ ] 댓글 + 대댓글
- [ ] 신고 시스템 (5건 이상 자동 블라인드)
- [ ] 금칙어 필터
- [ ] 게시글/댓글 Rate Limiting

### Step 12. 이의 제기 시스템

- [ ] 이슈별 "이의 제기" 버튼
- [ ] 출처 반박 + 근거 제출 폼
- [ ] 관리자 48시간 내 검토 큐
- [ ] 정정 시 변경 이력 표시

### Step 13. 추가 기능

- [ ] 정치인 개인 스코어카드 페이지
- [ ] 카카오톡 공유 최적화
- [ ] 구글/네이버 소셜 로그인 추가
- [ ] Twilio SMS OTP (필요시)

---

## 기술 스택 요약

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 15, TypeScript, Tailwind v4, Framer Motion |
| 디자인 | taste-skill dark-luxe |
| DB + Auth | Supabase (PostgreSQL + Auth) |
| 배포 | Vercel |
| CDN/보안 | Cloudflare (무료) |
| 크롤링 | Python (Scrapy), GitHub Actions |
| AI 분석 | Claude Haiku API |
| 캐싱 | Vercel KV or Upstash |
| OG 이미지 | @vercel/og |

## 예상 비용

| 항목 | 비용 |
|------|------|
| MVP 운영 | 월 ~$3 (Haiku API) |
| 도메인 (minnat.kr) | ~2만원/년 |
| 성장기 | 월 ~$48 (Vercel Pro + Supabase Pro) |

---

## 핵심 원칙

1. **팩트만** — 의견/추측/루머 수집 금지
2. **출처 투명** — 모든 점수에 원문 링크
3. **방법론 공개** — 가중치, 공식 전체 공개
4. **양쪽 동일 기준** — 동일 행위 동일 점수
5. **자정작용** — 상대편 까기 전에 니네 진영부터 봐
