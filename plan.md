# 민낯 (minnat) — 구현 계획서 v2

> "색안경 벗고, 팩트로 보는 정치"
> 도메인: minnat.kr
> 리서치: /Users/sungmin/minnat/docs/research.md

---

## 완료된 작업

- [x] Next.js 15 + Tailwind v4 + Framer Motion + Supabase 프로젝트 셋업
- [x] DB 스키마 생성 + RLS + 시드 데이터 (parties, politicians)
- [x] 메인 페이지 — 풀스크린 스플릿 + 먹물 배경 + 등장 애니메이션
- [x] 이슈 목록/상세 페이지 (필터, 정렬, 점수 근거 투명 공개)
- [x] 논란 정책 탭 (점수 미반영 별도 표시)
- [x] 방법론 전체 공개 페이지 (/about)
- [x] SEO (sitemap, robots, OG 이미지)
- [x] 보안 헤더 (CSP, HSTS, X-Frame-Options)
- [x] 크롤러 v1~v3 (국회 API, 팩트체크, 뉴스 RSS, 네이버, 법원) + GitHub Actions cron
- [x] 검증 시스템 (validator, dedup, cross_verify)
- [x] Supabase 실제 데이터 연동 (mock 제거)
- [x] Vercel 배포

---

## Phase 1: 데이터 품질 — DONE

### Step 1. 정치인 DB 확장 — 21명 → 300명+ --- DONE

- [x] 국회 OpenAPI로 22대 의원 300명 일괄 수집 (sync_politicians.py)
- [x] 정부 주요 직책자 추가 (대통령, 총리, 시장 등)
- [x] 크롤러에 정치인 동기화 — 매 실행 시 자동
- [ ] politicians 테이블에 직책 가중치 컬럼 추가 (Phase 4)

### Step 2. SNU 팩트체크 제거 + 팩트체크 소스 재구성 --- DONE

- [x] SNU 팩트체크 크롤러 제거 (2024년 8월 무기한 중단)
- [x] Tier 2 소스 교체: JTBC, MBC 알고보니, KBS 팩트체크K, SBS 사실은, 연합뉴스
- [x] 각 매체 크롤러 작성 (crawlers/factcheck.py — HTML 파싱)

### Step 3. policy_win 5단계 분해 --- DONE

- [x] 5단계 분리: bill_proposed(1) → bill_committee(3) → bill_plenary(6) → bill_promulgated(8) → bill_enforced(10)
- [x] 키워드 사전으로 결정론적 판정 (config.py: LEGISLATIVE_STAGE_KEYWORDS)
- [x] DB CHECK 제약조건 SQL 준비 (migration-002-bill-stages.sql)
- [x] 프론트엔드 카테고리 라벨 업데이트 (types/index.ts, constants.ts)

### Step 4. 뉴스 소스 확대 --- DONE

- [x] 네이버 검색 API 연동 (crawlers/naver_news.py)
- [x] 매체별 정치 성향 태깅 (진보/중도/보수)
- [x] RSS + 네이버 병행 수집

### Step 5. AI 프롬프트 고도화 --- DONE

- [x] 행위자/대상 규칙 명시 (규칙 1~4)
- [x] Chain-of-Verification 자기검증 (규칙 5)
- [x] evidence_sentence 필수 출력
- [x] 정치인 DB 300명+ 프롬프트 주입

### Step 6. 교차검증 고도화 --- DONE

- [x] 통신사 원문 식별 (재인용 1건 카운트)
- [x] 좌·우 매체 다양성 (같은 성향만이면 unverified)
- [ ] 보도 시점 차이 (Phase 4)

### Step 7. 기존 데이터 정리

- [ ] DB migration-001-validation.sql 실행 (Supabase SQL Editor)
- [ ] DB migration-002-bill-stages.sql 실행 (Supabase SQL Editor)
- [ ] 기존 11건 → flagged 처리
- [ ] 크롤러 v3로 재수집

---

## Phase 2: 점수 체계 고도화 — DONE

### Step 8. 시간 감쇠 뷰별 분리 --- DONE

- [x] 4개 뷰: Hot(30일) / Recent(1년) / Mid-term(5년) / All-time(무감쇠)
- [x] 메인 페이지에 ViewTabs 컴포넌트
- [x] 클라이언트 사이드 뷰 전환

### Step 9. 점수 공식 전환 --- DONE

- [x] 곱셈식 → 가중 합: `0.4×카테고리 + 0.3×심각도 + 0.2×범위 + 0.1×시간`
- [x] 시그모이드 squashing (0~100)
- [ ] A/B 테스트로 기존 분포 비교 (Phase 4)

### Step 10. 진영 비교 공정성 — Dual Metric --- DONE

- [x] 총합 + 1인당 평균 + 이슈 건수 병기
- [ ] 카테고리별 평균 점수 공시 (Phase 4)
- [ ] 군소정당 별도 섹션 (Phase 4)

### Step 11. 편향 자동 감사 --- DONE

- [x] bias_audit.py: Welch's t-test, 카테고리/매체/검증 분포
- [ ] 주간 cron 워크플로우 추가 (Phase 4)

### Step 12. 역사 데이터 수집 --- PARTIAL

- [x] seed_historical.py 스크립트 완료 (연도별/범위 수집)
- [ ] 실제 실행: `python seed_historical.py --range 2020-2025` (수동)
- [ ] SNU팩트체크 read-only DB 스크래핑 (수동)

---

## Phase 3: 고도화 + 커뮤니티 — PARTIAL

### Step 13. 정치인 스코어카드 --- DONE

- [x] 정치인 목록 페이지 (/politicians)
- [x] 개인별 스코어카드 (/politicians/[id]): 점수 요약 + 카테고리 breakdown + 관련 이슈
- [ ] 국회 OpenAPI 의정 통계 연동 (Phase 4)
- [ ] 시계열 뷰 (Phase 4)

### Step 14. NER + LLM 파이프라인 → Phase 4

- [ ] KPF-BERT-NER 자체 호스팅
- [ ] NER → Gazetteer → LLM CoT 3중 파이프라인
- [ ] BILL_NO 결정론적 매칭

### Step 15. 인증 + 게시판 --- PARTIAL

- [x] 로그인 페이지 UI (/auth/login — 카카오 버튼)
- [x] 회원가입 페이지 UI (/auth/signup — 진영 선택)
- [x] 게시판 목록/작성 페이지 UI (/board, /board/write)
- [ ] 카카오 OAuth + Supabase Auth 연동 (카카오 앱 등록 필요)
- [ ] 게시판 CRUD + 댓글 + 신고 (Supabase 연동)

### Step 16. 거버넌스 → Phase 4

- [ ] 자문위 5인 구성
- [ ] "논란 정책" 판정 합의제
- [ ] 분기별 점검 + 사유 공개

---

## Phase 4: 장기 과제 (미구현)

- [ ] KPF-BERT-NER 파이프라인 (Step 14)
- [ ] 거버넌스 자문위 (Step 16)
- [ ] 직책 가중치 컬럼
- [ ] 보도 시점 차이 기반 재인용 감지
- [ ] A/B 테스트 (점수 공식)
- [ ] 카테고리별/군소정당 평균 점수 공시
- [ ] 편향 감사 주간 cron 워크플로우
- [ ] 국회 OpenAPI 의정 통계 연동
- [ ] 정치인 시계열 뷰

---

## 소스 신뢰도 체계

| Tier | 소스 | 점수 반영 |
|------|------|-----------|
| 1 | 국회 의안정보시스템, 대한민국 법원, 중앙선관위, 법제처, 감사원 | 즉시 |
| 2 | JTBC 팩트체크(IFCN 인증), MBC 알고보니, KBS 팩트체크K, 연합뉴스 팩트체크, SBS 사실은 | 즉시 |
| 3 | 연합뉴스, KBS, MBC, SBS, 조선/중앙/동아, 한겨레/경향 | 좌+우 매체 다양성 확인 후 |
| 4 | 보조 참고 | 절대 미반영 |

※ ~~SNU 팩트체크~~: 2024년 8월 무기한 중단. read-only DB 역사 데이터 활용만.

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | Next.js 15, TypeScript, Tailwind v4, Framer Motion |
| DB + Auth | Supabase (PostgreSQL + Auth) |
| 배포 | Vercel |
| CDN/보안 | Cloudflare (무료) |
| 크롤링 | Python + GitHub Actions |
| AI 분석 | Claude Haiku (+ 중기: GPT-4o-mini ensemble) |
| 뉴스 수집 | 네이버 검색 API + RSS + 직접 크롤링 |
| NER (장기) | KPF-BERT-NER (HuggingFace) |

---

## 핵심 원칙

1. **팩트만** — 의견/추측/루머 수집 금지
2. **출처 투명** — 모든 점수에 원문 링크
3. **방법론 공개** — 가중치, 공식, 룰 전체 Git 기록
4. **양쪽 동일 기준** — 동일 행위 동일 점수 (Mirror Test)
5. **자정작용** — 상대편 까기 전에 니네 진영부터 봐
6. **의석수 보정** — 총합 + 1인당 평균 병기
7. **편향 감사** — 주간 자동 + 분기 자문위 점검
