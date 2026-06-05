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

---

# 민낯 사주 — 엔진 아키텍처 가이드

> **참고 문서**: `SAJU_BUILD_PLAN.md` — M0/M1/M2 빌드 플랜 + 완료 이력

## 서비스 개요

사주(四柱) 명리 AI 풀이 서비스. 생년월일시 입력 → 사주 4주 계산 → LLM 해석 반환.
minnat 레포 내 `/saju` 경로에 독립적으로 존재. 정치 플랫폼과 DB·배포 공유, 코드베이스 분리.

---

## 프로덕션 파이프라인

```
POST /api/saju/reading
  │
  ├── 입력 검증 (zod: year/month/day/hour/sex/tier/type/longitudeE)
  │
  ├── calcSajuServer()        ← server.ts
  │     ├── getSeolgiIndex()  ← seolgi.json 1회 로드 후 모듈 캐시
  │     ├── fromKST()         ← engine.ts: KST → BirthInput(UTC + 진태양시)
  │     └── computeFourPillars() ← engine.ts: 연/월/일/시주 + 대운
  │
  ├── buildFactSheet()        ← factsheet.ts: LLM 앵커링용 정형 데이터
  │     ├── analyzeAdvanced() ← advanced.ts: 사령·합화·신강·격국·용신
  │     ├── 십신맵, 신살, 세운, 대운
  │     └── notableSignals[]  ← LLM 프롬프트 핵심 신호
  │
  ├── Upstash Redis 캐시      ← 동일 출생정보 재요청 시 즉시 반환
  │     캐시키: saju:r:{version}:{tier}:{type}:{y.gz}-{m.gz}-{d.gz}-{h.gz|'x'}
  │
  └── Anthropic Claude 호출   ← factsheet → 프롬프트 → 풀이 스트림
```

---

## 파일별 역할

### 프로덕션 파일 (`src/lib/saju/`)

| 파일 | 역할 | 신뢰도 |
|------|------|--------|
| `engine.ts` | 4주+대운 순수 계산. `fromKST()` + `computeFourPillars()`. 일주 offset=49 | ✅ 안정 |
| `seolgi-loader.ts` | seolgi.json 이진탐색. `latestJieBefore` / `nextJieAfter` / `prevJieBefore` | ✅ 안정 |
| `eot.ts` | Spencer 균시차(EOT) 공식. 진태양시 계산. ±30초 정확도 | ✅ 안정 |
| `constants.ts` | STEMS/BRANCHES/ELEMENTS/STEM_DATA/BRANCH_DATA/GENERATES/CONTROLS | ✅ 안정 |
| `sipshin.ts` | 십신(十神) 계산. `getSipshin()` / `getBranchSipshin()` | ✅ 안정 |
| `advanced.ts` | 사령·오행세력·합화·신강/신약·격국·용신(억부법). `analyzeAdvanced()` | ✅ 테스트 44케이스 |
| `factsheet.ts` | LLM 앵커링용 `SajuFactSheet` 빌드. 신살·세운·대운·notableSignals | ✅ 안정 |
| `server.ts` | `getSeolgiIndex()` (모듈 캐시) + `calcSajuServer()` 진입점 | ✅ 안정 |
| `interpret.ts` | `DAY_MASTER_PROFILE` (일간별 성격) + `SIPSHIN_DESC` + `getCompat()` | ✅ 안정 |
| `lunar.ts` | `lunarToSolar()` — korean-lunar-calendar 래퍼 | ✅ 안정 |

### 레거시 파일 (프로덕션 미사용, @deprecated 완료)

| 파일 | 이유 | 위험 |
|------|------|------|
| `pillars.ts` | Jean Meeus 근사, EOT 보정 없음 | MEDIUM — export 중이므로 혼용 주의 |
| `solar.ts` | 위와 동일. `pillars.ts`에서만 사용 | MEDIUM |
| `index.ts` | `buildSajuResult` 등 레거시 API 재export | MEDIUM |

> **규칙**: 새 코드에서 `pillars.ts` / `solar.ts` / `buildSajuResult` 절대 임포트 금지.
> 프로덕션은 항상 `server.ts → engine.ts` 파이프라인만 사용.

### 정적 데이터

| 파일 | 내용 |
|------|------|
| `public/seolgi.json` | 1880–2100년 절기 5304개. Skyfield 배치로 생성. UTC 인스턴트 포함 |

---

## 핵심 알고리즘

### 일주 (日柱)

```
JDN = 율리우스적일 (Fliegel-Van Flandern 공식)
gz  = (JDN + 49) % 60           ← offset=49
일주 = STEMS[gz%10] + BRANCHES[gz%12]
```

**기준점 (교차검증 완료)**:
- 1999-04-04 = 丙戌(gz=22): 복수 한국 사주 플랫폼 확인
- 2024-01-01 = 甲子(gz=0): offset 검산

> ⚠️ offset을 변경하면 전체 일주 + 시주가 틀어짐. 반드시 두 기준점 모두 재검증.

### 진태양시 (眞太陽時)

```
apparentMin = UTC분 + 경도×4 + EOT(doy)
solarDate   = UTC날짜 + dayOffset        ← 일주 경계 판정 기준
solarTime   = apparentMin % 1440         ← 시주 계산 기준
```

- **연·월주**: UTC 절기 인스턴트로 직접 비교 (진태양시 보정 없음 — 개념 분리)
- **일·시주**: 출생지 진태양시로 판정

### 월주 — 오호둔(五虎遁)

```
TIGER_MONTH_STEM = [2, 4, 6, 8, 0]   // 甲己→丙 / 乙庚→戊 / 丙辛→庚 / 丁壬→壬 / 戊癸→甲
월간 = (TIGER[yearStemIdx % 5] + monthOrder) % 10
monthOrder = (branch - 2 + 12) % 12   // 寅(2)을 0번째로
```

### 시주 — 오서둔(五鼠遁)

```
RAT_HOUR_STEM = [0, 2, 4, 6, 8]      // 甲己→甲 / 乙庚→丙 / 丙辛→戊 / 丁壬→庚 / 戊癸→壬
branch = floor((solarTotalMin + 60) / 120) % 12   // 23:00 → 子(0)
시간 = (RAT[dayStemIdx % 5] + branch) % 10
```

### 대운 (大運)

```
양년남/음년여 → 순행 (nextJieAfter까지 일수 ÷ 3 = 교운나이)
음년남/양년여 → 역행 (prevJieBefore까지 일수 ÷ 3)
교운나이 = Math.round(exactYears)   // 자평 기본값 (학파별 ceil/floor 가능)
```

### 세운 (歲運) — factsheet.ts 내부

```
gz = mod(year - 4, 60)
세운간지 = STEMS[gz%10] + BRANCHES[gz%12]
현재년도 기준: KST UTC+9 보정 (UTC 12/31 23:xx 오판 방지)
```

---

## advanced.ts — L3/L4 레이어

### 사령 (司令 / 月律分野)

- 지장간(JIJANGGAN) — 여기(0.3) / 중기(0.6) / 정기(1.2) 가중치
- `calcSalyeong(branch, daysFromJie)` → 당령신 반환
- `daysFromJie` = `(birthUTC - jieUTC) / 86400000`

### 오행 세력 정량화

```
S(e) = Σ [ w_pos × seasonCoeff(e, monthEl) × rootBonus × salyeongBonus(1.3) ]
```

- **왕상휴수사**: 旺1.4 / 相1.2 / 休1.0 / 囚0.8 / 死0.6
- **통근 보너스**: 정기근1.5 / 중기근1.2 / 여기근1.1

### 신강/신약

```
ratio = (일간오행점수 + 인성오행점수) / total
> 0.58 → strong  /  < 0.42 → weak  /  그 외 → neutral
```

### 격국 (格局)

```
건록격: mbIdx === ROK_IDX[dm]       // ROK_IDX: 갑2 을3 병5 무5 정6 기6 경8 신9 임11 계0
양인격: mbIdx === YANGIN_IDX[dm]    // YANGIN_IDX: 갑3 을4 병6 무6 정7 기7 경9 신10 임0 계1
십신격: 사령신 투간여부 → deterministic/heuristic
```

### 용신 (用神) — 억부법

```
종격 가드: 한 오행 ≥ 70% → 억부 부적용, dominant 오행이 용신
신강: 식상·재·관 중 점수 최소 오행
신약: 인성·비겁 중 점수 최소 오행
중화: yongsin=null
```

---

## SchoolProfile (학파 파라미터)

```typescript
DEFAULT_SCHOOL = {
  strongThreshold:    0.58,   // 신강 임계값
  weakThreshold:      0.42,   // 신약 임계값
  halfHapRule:        'loose', // 반합: loose(통설) / strict(왕지 포함만)
  yukhapOhMi:         '토',    // 午未합 화신: 자평진전 기준 土
  jonggyeokThreshold: 0.70,   // 종격 판단 임계값
  daeunRounding:      'round', // 대운 교운나이 반올림 규약
}
```

---

## 테스트 현황 (2026-06-05 기준)

| 파일 | 케이스 | 상태 |
|------|--------|------|
| `__tests__/golden.test.ts` | 43 | ✅ all green |
| `__tests__/advanced.test.ts` | 44 | ✅ all green |
| **합계** | **87** | **✅** |

### golden.test.ts 커버리지

- 핵심 4주 (병술일 1999-04-04, 갑자일 기준점, 60년주기, KST 롤오버)
- 입춘 경계 ±30분 정밀 케이스
- 절기 경계 (청명 전후)
- 오호둔 寅月 + **子月·丑月 5연간 ×2 = 10케이스** ← 이전 공백
- 오서둔 시주, 진태양시 경계
- 야자시/조자시 (zi_hour 모드)
- 대운 순행/역행
- **경도 차이** — 서울(127°E) vs 부산(129°E) 시주 분파
- **seolgi.json 1880년 최초 범위**
- **boundary_caution 플래그**
- **음력 입력** — lunarToSolar 변환 후 4주 검증
- seolgi-loader 이진탐색 정확성 (2020년 전수)
- EOT 수치 범위

### advanced.test.ts 커버리지

- 사령(calcSalyeong) 지장간 경계 케이스
- 통근(findRoots) 정기/중기/여기 보너스
- 합화 성립/불성립 (dist·月令 계수)
- 육합·삼합·반합·육충 탐지
- 신강/신약/중화 판정
- 격국: 건록·양인·십신격, 투간 여부
- 종격 가드, 임계값 커스텀
- 용신 억부법 (신강→관금, 신약→비겁)
- SchoolProfile loose/strict 반합 차이

---

## API 라우트

| 엔드포인트 | 설명 |
|------------|------|
| `POST /api/saju/reading` | 사주 AI 풀이 (메인. Redis 캐시 + Anthropic) |
| `GET /api/saju/history` | 사용자 풀이 이력 |
| `GET /api/saju/readings/[id]` | 특정 풀이 상세 |
| `GET /api/saju/public/[id]` | 공개 공유 풀이 |

## 페이지 라우트

| 경로 | 설명 |
|------|------|
| `/saju` | 사주 입력 폼 |
| `/saju/[type]` | 풀이 유형 선택 (full/today/love/career) |
| `/saju/[type]/[id]` | 풀이 결과 페이지 |
| `/saju/view/[id]` | 공개 공유 뷰 |

---

## 환경변수 (사주)

```
UPSTASH_REDIS_REST_URL=    ← 캐시
UPSTASH_REDIS_REST_TOKEN=
ANTHROPIC_API_KEY=         ← LLM 호출
```

---

## 알려진 제약 / 주의사항

1. **seolgi.json 범위**: 1880–2100년. 범위 밖 입력 시 첫/마지막 절기로 fallback — 엔진이 오류를 내지 않으므로 입력 검증(zod: min(1880) max(2100))이 필수.

2. **EOT 정확도**: Spencer 근사 ±30초. 절기 경계 ±30분 이내 출생은 `boundary_caution=true` 플래그가 설정되며 LLM 프롬프트에서 사용자에게 안내 권장.

3. **일주 offset=49**: 두 기준점 반드시 함께 검증.
   - 1999-04-04 = 丙戌(gz=22)
   - 2024-01-01 = 甲子(gz=0)

4. **연·월주는 UTC 절기 기준**: 진태양시 보정 없음. 일·시주만 경도+EOT 적용. 혼용 금지.

5. **종격 임계값 0.70**: 단 하나의 오행이 70% 이상이면 억부법 부적용. 극단 차트 구성 시 용신 테스트 작성 시 주의.

6. **레거시 혼용 금지**: `import { calcSaju } from '@/lib/saju'` → `pillars.ts` 레거시 경로. 항상 `server.ts` 또는 `engine.ts` 직접 사용.

7. **LLM 비용**: `tier=free`는 간략 버전 프롬프트. `tier=paid`는 전체 factsheet 사용. Redis 캐시 미적용 시 동일 요청 반복 호출 주의.

---

## 빌드 플랜 진행 현황

자세한 내용: `SAJU_BUILD_PLAN.md`

```
M0 (완료) — 코어 락다운
  ✅ M0.1 seyun KST 수정
  ✅ M0.2 advanced.ts 단위 테스트 44케이스
  ✅ M0.3 골든 테스트 43케이스 (+18 추가)
  ✅ M0.4 @deprecated 레거시 정리

M1 (진행 예정) — 무료 출시
  [ ] 통변 모순/몰개성 차단 + 블라인드 QA
  [ ] 오늘의 운세 개인화 (대운+세운 프롬프트 강화)
  [ ] 궁합 엔진 (두 FourPillars 합충+오행보완+십신역학)
  [ ] 무료 차트 캡
  [ ] 도메인 렌즈 분기 (love/career/today buildFactSheet 분기)

M2 (출시 후) — 트래픽 기반 확장
  방합·암합·12신살·월운일운·용신확장·SchoolProfile UI 등
```
