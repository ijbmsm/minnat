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
- [x] 크롤러 v1 (국회 API, 뉴스 RSS, 법원) + GitHub Actions cron
- [x] 크롤러 v2 (검증 시스템: validator, dedup, cross_verify)
- [x] Supabase 실제 데이터 연동 (mock 제거)
- [x] Vercel 배포

---

## Phase 1: 데이터 품질 (1~2주, Quick Wins)

### Step 1. 정치인 DB 확장 — 21명 → 300명+

- [ ] 국회 OpenAPI `국회의원 현황` 엔드포인트로 22대 의원 300명 일괄 수집
  - 출력: HG_NM(이름), POLY_NM(정당), ELECT_DIV_NM(지역구/비례)
- [ ] 정부 주요 직책자 ~50명 추가 (대통령, 총리, 장관)
- [ ] 크롤러에 정치인 동기화 스크립트 추가 (주 1회 cron)
- [ ] politicians 테이블에 직책 가중치 컬럼 추가:
  - 대통령: 1.2 / 총리·당대표·원내대표: 1.0 / 장관·의원: 0.8

### Step 2. SNU 팩트체크 제거 + 팩트체크 소스 재구성

- [ ] SNU 팩트체크 크롤러 제거 (2024년 8월 무기한 중단 확인)
- [ ] Tier 2 소스 교체:
  - JTBC 팩트체크 (유일한 IFCN 인증 매체)
  - MBC 알고보니
  - KBS 팩트체크K
  - 연합뉴스 팩트체크
  - SBS 사실은
- [ ] 각 매체 크롤러 작성 (HTML 파싱)

### Step 3. policy_win 5단계 분해

- [ ] 기존 단일 policy_win 폐기, 5단계로 분리:
  ```
  bill_proposed      (발의/제안)         — 가중치 1
  bill_committee     (위원회 통과)       — 가중치 3
  bill_plenary       (본회의 가결)       — 가중치 6
  bill_promulgated   (공포)             — 가중치 8
  bill_enforced      (시행)             — 가중치 10
  ```
- [ ] 키워드 사전으로 결정론적 판정 (LLM 의존 제거):
  ```python
  STAGE_KEYWORDS = {
      "bill_proposed": ["발의", "제안", "제출", "법안 마련"],
      "bill_committee": ["상임위 통과", "위원회 의결", "소위 가결"],
      "bill_plenary": ["본회의 가결", "본회의 통과", "표결로 통과"],
      "bill_promulgated": ["공포", "관보 게재"],
      "bill_enforced": ["시행", "발효", "효력 발생"],
  }
  ```
- [ ] DB `issues.category` CHECK 제약조건 업데이트
- [ ] 프론트엔드 카테고리 라벨 업데이트

### Step 4. 뉴스 소스 확대

- [ ] 네이버 검색 API 연동 (openapi.naver.com/v1/search/news.json)
  - Client ID/Secret 무료 발급, 일 25,000건
  - 정치인 이름·키워드로 polling
- [ ] akngs/knews-rss 오픈소스 활용 (커뮤니티 유지보수 RSS 목록)
- [ ] 현재 SBS만 수집 → 최소 5개 매체 동시 수집
- [ ] 수집 매체별 정치 성향 태깅:
  ```
  진보: 한겨레, 경향신문, 오마이뉴스
  중도: KBS, MBC, SBS, 연합뉴스
  보수: 조선일보, 중앙일보, 동아일보
  ```

### Step 5. AI 프롬프트 고도화

- [ ] 행위자/대상 규칙 명시 (A5 템플릿 적용):
  - "X가 비판받았다" → 행위자는 X (X가 행위를 했음)
  - "X를 비판한 Y" → 행위자는 Y
- [ ] Chain-of-Verification 자기검증:
  - "actor 진영을 반대로 바꾸면 같은 점수가 나오는가?"
  - "아니오"면 confidence 0.6 이하로
- [ ] evidence_sentence 필수 출력
- [ ] 정치인 DB 300명+ 프롬프트 주입

### Step 6. 교차검증 고도화

- [ ] 통신사 원문 식별: "연합뉴스 제공" byline 감지 → 재인용은 1건 카운트
- [ ] 좌·우 매체 다양성: 좌+우 모두 보도 시만 verified (같은 성향만이면 unverified)
- [ ] 보도 시점 차이: 1시간 이내 동일 = 재인용 가능성, 12시간+ = 독립 보도

### Step 7. 기존 데이터 정리

- [ ] DB migration-001-validation.sql 실행 (validation_status 컬럼 추가)
- [ ] 기존 11건 → flagged 처리
- [ ] 크롤러 v2로 재수집

---

## Phase 2: 점수 체계 고도화 (1~3개월)

### Step 8. 시간 감쇠 뷰별 분리

- [ ] 4개 뷰 구현:
  | 뷰 | 감쇠 함수 | 용도 |
  |---|---|---|
  | Hot (30일) | score / (T_hours + 2)^1.8 | 최신 이슈 |
  | Recent (1년) | score × e^(-0.005t) | 반감기 140일 |
  | Mid-term (5년) | score × max(0.3, e^(-0.002t)) | 30% floor |
  | All-time | score × 1 (무감쇠) | 역사적 누적 |
- [ ] 메인 페이지에 뷰 전환 탭
- [ ] score_snapshots에 view_type 컬럼 추가

### Step 9. 점수 공식 전환 — 곱셈 → 가중 합

- [ ] 현재: `카테고리 × 감쇠 × 심각도 × 영향범위` (한 차원 0이면 전체 0)
- [ ] 변경: `0.4×norm(category) + 0.3×norm(severity) + 0.2×norm(scope) + 0.1×norm(time)`
- [ ] 최종 0~100 시그모이드 squashing: `100 / (1 + exp(-k(x - x₀)))`
- [ ] A/B 테스트로 기존 분포와 비교

### Step 10. 진영 비교 공정성 — Dual Metric

- [ ] 총합 점수 + 1인당 평균 점수 병기
  - 민주당 175석 vs 국민의힘 108석 → 총합만 비교하면 다수당이 구조적 불리
- [ ] 카테고리별 평균 점수 공시 (예: "막말 blue 평균 4.2 vs red 평균 4.5")
- [ ] 군소정당 별도 섹션 (정의당, 진보당, 개혁신당 등)

### Step 11. 편향 자동 감사

- [ ] 주간 cron — 카테고리 × 진영 점수 분포:
  ```sql
  SELECT category, camp, AVG(weighted_score), COUNT(*), STDDEV(weighted_score)
  FROM issues
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY category, camp;
  ```
- [ ] Welch's t-test (p<0.05)로 진영별 평균 차이 자동 알람
- [ ] 매체별 분류 분포 (분류기 편향 지표)

### Step 12. 역사 데이터 수집 (1999~현재)

- [ ] SNU팩트체크 read-only DB 1회성 스크래핑 (2017~2024, ~5,000건)
- [ ] 위키백과/나무위키 정치 사건 목록 연도별 크롤링
- [ ] 네이버 뉴스 아카이브 과거 기사 검색
- [ ] Claude API로 역사 이슈 분류/점수화
- [ ] 기간별 뷰 (All-time)에서 활용

---

## Phase 3: 고도화 + 커뮤니티 (3~6개월)

### Step 13. 정치인 스코어카드

- [ ] 개인별 페이지: 의정 통계 + minnat 점수 + 카테고리 breakdown
- [ ] 국회 OpenAPI 연동: 출석률, 발의, 가결률, 표결 참여
- [ ] 직책별 영향범위 가중치 (대통령 1.2 ~ 후보 0.5)
- [ ] 시계열 뷰: 30일/1년/5년/역대 4탭

### Step 14. NER + LLM 파이프라인

- [ ] KPF-BERT-NER (HuggingFace, MIT 라이선스) 자체 호스팅
- [ ] NER → Gazetteer 매칭 → LLM CoT 3중 파이프라인
- [ ] 국회 의안정보 API 결정론적 매칭 (BILL_NO → PROC_RESULT_CD)
  - policy_win 판정에서 LLM 의존도 0

### Step 15. 인증 + 게시판

- [ ] 카카오 소셜 로그인 + Supabase Auth
- [ ] 자유게시판 CRUD + 댓글 + 신고
- [ ] 진영 표시 (홍/청/없음)

### Step 16. 거버넌스

- [ ] 자문위 5인 (좌·중·우 학계 + 시민단체 + 운영자)
- [ ] "논란 정책" 판정 합의제
- [ ] 분기별 점검 + 사유 공개
- [ ] 방법론 변경 Git 기록 + 사유 공개

---

## 소스 신뢰도 체계 (업데이트)

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
| 뉴스 수집 | 네이버 검색 API + knews-rss + 직접 크롤링 |
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
