# 민낯 (minnat) — 프로젝트 가이드

> "우리는 점수 매기지 않는다. 사회·제도의 반응을 측정만 한다."

## 프로젝트 구조

```
minnat/                  ← Next.js 프론트엔드 (이 repo)
minnat-crawler/          ← Python 크롤러 (별도 repo: ijbmsm/minnat-crawler)
```

## 핵심 철학 (코드에 반영 필수)

1. **공식 처분만 점수화** — 검찰 기소/법원 판결/윤리위 처분/감사원 적발/팩트체크 false/본인 시인
2. **막말·위선·정책 호불호 = archive** — 원문 보존, 점수 X, 판단은 사용자 몫
3. **정치인 개인 종합 점수 절대 금지** — 이슈 단위만, 랭킹 금지
4. **법안 통과 = 가점 아님** — 입법은 사실 기록(archive)일 뿐
5. **표결 점수화 금지** — 의견은 존중, 점수 대상 아님
6. **단정·평가 표현 금지** — "부패한", "무능한" 등 사용 금지, attribution 형태만

## 카테고리 체계 v1.1

### 점수 카테고리 (6개, 공식 처분)
- `criminal_conviction` — 형사 유죄/기소/기소유예 (criminal_stage 필수)
- `civil_judgment` — 민사 패소
- `ethics_violation` — 윤리위·선관위 처분
- `factcheck_false` — IFCN false 판정
- `self_admission` — 본인 공식 시인·사과
- `official_misconduct` — 감사원·국정감사 적발

### Archive 카테고리 (5개, 점수 X)
- `controversial_statement` — 막말·논란 발언
- `policy_record` — 정책·발의·표결 이력
- `attendance_record` — 출석률
- `media_coverage` — 보도 모음
- `politician_sns` — 본인 SNS

### 입법 기록 (5개, 점수 X)
- `bill_proposed` → `bill_committee` → `bill_plenary` → `bill_promulgated` → `bill_enforced`

## 점수 공식 v1.1

```
base = 보도량(×0.40) + 공식처리단계(×0.35) + 지속일수(×0.25)
score = base × 진영다양도(0.7~1.3) × 직책가중치(0.5~1.2) × 시간감쇠
```

형사 단계 가중치: 수사(0) → 기소(2) → 기소유예(1.5) → 1심(4) → 2심(6) → 대법(10) → 사면(10유지)

## 기술 스택

- **프론트**: Next.js 15 (App Router), TypeScript, Tailwind v4, Framer Motion
- **DB**: Supabase (PostgreSQL + RLS)
- **배포**: Vercel
- **크롤러**: Python + GitHub Actions cron
- **AI**: Claude Haiku 4.5

## 주요 파일

### 프론트
- `src/types/index.ts` — 모든 타입 정의
- `src/lib/constants.ts` — 카테고리, 형사 단계, 직책 가중치, 매체 매핑
- `src/lib/score.ts` — 점수 계산 + 시간 감쇠 4개 뷰
- `src/lib/data.ts` — Supabase 데이터 fetch
- `src/components/split-screen.tsx` — 메인 스코어보드
- `src/components/fluid-background.tsx` — 먹물 배경
- `src/components/issue-card.tsx` — 이슈 카드
- `src/components/issue-detail-page.tsx` — 이슈 상세

### 크롤러 (minnat-crawler repo)
- `config.py` — 카테고리, 가중치, 매체 매핑
- `analyzer.py` — Claude Haiku AI 분류 (v1.1 프롬프트)
- `trust_gate.py` — 신뢰도 게이트 (costly signal, 매체 다양성)
- `validator.py` — 2차 검증 (camp 일치, confidence 임계값)
- `expression_filter.py` — 표현 자동 검수 (금지어, attribution)
- `dedup.py` — 중복 감지
- `auto_verify.py` — 미검증 이슈 자동 승격
- `scorer.py` — 점수 산출 + 스냅샷
- `main.py` — 크롤러 파이프라인
- `seed_historical.py` — 역사 데이터 시드
- `sync_politicians.py` — 정치인 DB 동기화

## 소스 신뢰도

| Tier | 소스 | 점수 반영 |
|------|------|-----------|
| 1 | 국회 API, 법원, 선관위, 법제처, 감사원 | 즉시 verified |
| 2 | JTBC/MBC/KBS/SBS/연합 팩트체크 | 즉시 verified |
| 3 | 뉴스 (네이버, RSS) | 교차검증 후 |
| 4 | 보조 참고 | 절대 미반영 |

## 신뢰도 게이트 HIGH 신호

- 자기 진영 매체가 자기 진영 비판 + 다수 매체 (costly signal)
- 좌+중+우 매체 다양 보도
- 본인 공식 시인·사과
- 공식 기관 처분
- 다중 매체 + 물증 키워드

## 알려진 이슈 (해결 필요)

1. **dedup 미흡** — 같은 사건이 3건씩 중복 저장됨. actor + category + 7일 이내 = 같은 사건으로 병합 필요
2. **criminal_conviction 오분류** — 기사 주제가 선거인데 과거 전과 "언급만" → media_coverage여야 함
3. **배경 깜빡임** — 뷰 탭 전환 시 width 변화 + blur 레이어 reflow. CSS transition으로 변경함, 확인 필요
4. **시드 데이터 부족** — 네이버 날짜 필터(ds/de) 추가했으나 재실행 필요
5. **경계선 직선 2개** — 파랑/빨강 gradient 끝이 겹치는 부분. overlap 조정 필요

## 환경변수

### minnat (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### minnat-crawler (GitHub Secrets)
```
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
ANTHROPIC_API_KEY=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
DATA_GO_KR_API_KEY=
```

## 참고 문서

- `plan-v1.1.md` — 구현 계획서
- `docs/research.md` — 외부 AI 리서치 (검증/편향/학술)
- `docs/direction-research.md` — v1.1 갭 분석
- `supabase/migration-v1.1.sql` — DB 스키마

## 명시적으로 안 하는 것

- 정치인 개인 종합 점수
- 정치인 랭킹
- "X당이 더 나쁘다" 결론 문구
- 막말·위선·정책 호불호 점수화
- 표결 점수화
- 법안 통과 자체 가점
- 추측·평가·단정 표현
- 익명 반론 폼
