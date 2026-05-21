# v1.1 방향성 반영 — 현재 코드 vs 새 설계 갭 분석

> v1.1 핵심: "우리는 점수 매기지 않는다. 사회·제도의 반응을 측정만 한다."
> 작성일: 2026-05-22

---

## 1. 카테고리 체계 — 전면 재설계 필요

### 현재 (17개, 가점/감점 이분법)

```
감점: crime, corruption, hypocrisy, slander, division, policy_fail, promise_broke
가점: bill_proposed~enforced, policy_win, promise_kept, charity
미반영: controversial
```

### v1.1 (11개, 점수/archive 이분법)

```
점수 부여 (6개):
  criminal_conviction — 형사 유죄 (단계별)
  civil_judgment — 민사 패소
  ethics_violation — 윤리위·선관위 처분
  factcheck_false — IFCN false 판정
  self_admission — 본인 공식 시인·사과
  official_misconduct — 감사원·국정감사 적발

Archive (5개, 점수 X):
  controversial_statement — 막말·논란 발언 (원문 + 맥락)
  policy_record — 발의·표결 이력
  attendance_record — 출석률
  media_coverage — 보도 모음 (진영별)
  politician_sns — 본인 SNS·삭제 게시물

입법 처리 (점수 X, 사실 기록만):
  bill_proposed → bill_committee → bill_plenary → bill_promulgated → bill_enforced
```

### 수정 범위

| 파일 | 변경 |
|------|------|
| `types/index.ts` | IssueCategory 타입 전면 교체 |
| `constants.ts` | CATEGORIES 배열 전면 교체, isPositive 제거 → isScored/isArchive |
| `config.py` | CATEGORIES, CATEGORY_WEIGHT 전면 교체, POSITIVE_CATEGORIES 제거 |
| `analyzer.py` | AI 프롬프트 카테고리 정의 전면 재작성 |
| `validator.py` | BILL_CATEGORIES 등 카테고리 참조 전부 수정 |
| `score.ts` | 가점/감점 분리 로직 제거 → 점수 카테고리만 합산 |
| `about/page.tsx` | 방법론 페이지 카테고리 표 전면 교체 |
| `category-summary.tsx` | isPositive 색상 분기 제거 |
| `issue-card.tsx` | 가점/감점 표시 → archive/scored 구분으로 변경 |
| `issue-detail-page.tsx` | 점수 근거 섹션 재작성 |

### 내 의견 — 이건 좀 아닌데

**hypocrisy(위선), slander(막말), division(갈등 조장) → archive로 이동은 동의한다.** 가치판단이 섞이기 쉬운 영역.

**그러나 corruption(부정부패)을 criminal_conviction에 통합하면 문제:**
- 뇌물 수수로 기소만 된 상태 → criminal_conviction이 아님 (유죄 확정 전)
- 기소유예도 criminal_conviction이 아님 (검찰 재량)
- v1.1의 "검찰 처분 6종 분리"가 이걸 커버하지만, 현재 DB에는 검찰 처분 단계 필드가 없음

**policy_fail 삭제에 대해:**
- "정책 시행 후 측정 가능한 피해"는 가치판단이 아님 — 통계 근거가 있으면 팩트
- 다만 "누구 책임인가"는 가치판단 → archive가 맞음
- 결론: policy_fail은 "공식 기관(감사원 등)이 실패로 판정한 경우"만 점수, 나머지는 archive

---

## 2. 점수 공식 — 전면 교체

### 현재

```
raw = 0.4 × norm(카테고리) + 0.3 × norm(심각도) + 0.2 × norm(범위) + 0.1 × norm(시간)
score = 100 / (1 + exp(-10 × (raw - 0.3)))
```

### v1.1

```
base_score = 보도량_정규화 × 0.40
           + 공식처리_단계 × 0.35
           + 헤드라인_지속일수 × 0.25

score = base_score
        × 진영_다양도_multiplier (0.7~1.3)
        × 시기_보정 (rolling_baseline × 선거_디스카운트)
        × 직책_가중치 (0.5~1.2)
```

### 수정 범위

| 파일 | 변경 |
|------|------|
| `score.ts` | 전면 재작성 — 보도량/공식처리/지속일수 기반으로 |
| `scorer.py` | 크롤러 점수 엔진도 동일하게 재작성 |
| `issue-detail-page.tsx` | 점수 근거 표시 UI 재작성 |
| `about/page.tsx` | 방법론 공식 설명 재작성 |

### 새로 필요한 데이터

| 필드 | 설명 | 현재 |
|------|------|------|
| `coverage_count` | 보도한 매체 수 | 없음 — cross_verified_sources에서 추출 가능 |
| `headline_days` | 첫 보도~마지막 보도 일수 | 없음 — 이슈 클러스터링 필요 |
| `official_stage` | 검찰/법원 처리 단계 | 없음 — DB 컬럼 추가 필요 |
| `position_weight` | 직책 가중치 | 없음 — politicians 테이블에 추가 |
| `election_proximity` | 선거 근접도 | 없음 — 선관위 API 연동 필요 |
| `media_diversity` | 진영 다양도 | cross_verify.py에서 부분 계산 중 |

### 내 의견

**보도량 정규화(0.40)가 최대 가중치인 건 위험하다.**
- 보수 매체가 진보 정치인을 집중 보도하면 → 보도량↑ → 점수↑
- 이건 "사회의 반응 측정"이 아니라 "매체 편향 증폭"
- **해결: 보도량은 진영별 정규화 필요** — 좌 매체 보도량 + 우 매체 보도량을 별도 카운트하고, 양쪽 균형 있을 때만 높은 보도량 인정

**선거 디스카운트(×0.7)는 좋은 아이디어지만 구현이 복잡:**
- 선거일 자동 감지 필요 (선관위 API)
- 보궐선거, 재선거 등 비정기 선거도 커버해야
- 일단 Phase 2로 미루고, 수동 flag로 시작 권장

---

## 3. 검증 — 신뢰도 게이트 재설계

### 현재

```
Tier 1 → 즉시 verified
Tier 2~3 → 교차검증 (2개 매체 + 좌우 다양성)
```

### v1.1 — 5가지 HIGH 신호

```
1. 자기 진영 매체가 자기 진영 비판 + 다수 매체 → HIGH
2. 좌+중+우 매체 다양 보도 → HIGH
3. 본인 공식 시인·사과 → HIGH
4. 공식 기관 처분 (검찰·법원·윤리위·감사원·선관위) → HIGH
5. 다중 매체 + 물증 (영상·녹취) → HIGH
```

### 수정 범위

| 파일 | 변경 |
|------|------|
| `cross_verify.py` | costly signal(자기 진영 비판) 감지 로직 추가 |
| `auto_verify.py` | 신뢰도 등급(HIGH/MEDIUM/LOW) 도입 |
| `validator.py` | 공식 기관 처분 자동 감지 |
| `analyzer.py` | "본인 시인" 감지 프롬프트 추가 |
| DB | `trust_level` 컬럼 추가 (high/medium/low/pending) |

### 내 의견

**"자기 진영 매체가 자기 진영 비판"은 costly signal로 좋지만, 자동 감지가 어렵다:**
- "한겨레가 이재명을 비판" → 한겨레=progressive, 이재명=blue → costly signal
- 이건 매체 성향(MEDIA_LEAN) + actor camp 비교로 구현 가능
- **구현 난이도: 중간.** cross_verify.py에 추가 가능.

**"물증(영상·녹취)" 자동 감지는 현실적으로 불가능:**
- 뉴스 텍스트에서 "영상이 공개됐다", "녹취록에 따르면" 같은 키워드로 간접 감지만 가능
- 영상/녹취 자체를 검증하는 건 범위 밖

---

## 4. 검찰 처분 6종 분리 — 신규

### v1.1 설계

```
혐의없음 (사실 아님) → 점수 0, UI 숨김, DB 보관
죄가안됨 (법조항 안 맞음) → archive 유지
공소권없음 (시효·사망) → archive 유지
기소유예 → 점수 부여 (검찰이 죄 인정)
기소중지 → archive 유지
각하 → 비공개
```

### 형사 단계 가중치

```
수사 착수 → 점수 X, 기록만
기소 → 2
기소유예 → 1.5
1심 유죄 → 4
2심 유죄 → 6
대법 확정 → 10
사면 → 점수 유지 (죄 무효 X)
```

### 수정 범위

- DB: `issues` 테이블에 `criminal_stage` 컬럼 추가
- `config.py`: CRIMINAL_STAGE_WEIGHT 딕셔너리
- `analyzer.py`: 형사 단계 판정 프롬프트
- `score.ts`: criminal_conviction 점수 = stage_weight 기반
- `issue-card.tsx`: 형사 단계 표시 (진행 중/확정)
- `issue-detail-page.tsx`: 형사 타임라인 표시

### 내 의견

**"1심·2심 무죄 시 메인에서 즉시 비공개"는 중요하지만 자동화가 어렵다:**
- 법원 판결 자동 수집이 현재 안 됨 (대법원 API 302 에러)
- 수동으로 업데이트해야 함 → 관리자 도구 필요
- **제안: 일단 "진행 중" 라벨로 표시하고, 무죄 시 수동 비공개 처리**

**사면 → 점수 유지는 논란 가능:**
- "사면받았으니 깨끗하다" vs "사면은 죄를 없애는 게 아니다"
- v1.1 입장은 후자 → 동의하지만, 방법론 페이지에서 명확히 설명 필요

---

## 5. 표현 자동 검수 — 신규

### v1.1 설계

```
단정 표현 차단 → attribution 형태로 강제 변환
평가 표현 차단 ("부패한", "무능한", "악의적" 등)
의혹 단계는 "확정 전" 라벨 자동 부착
```

### 수정 범위

- `analyzer.py`: summary 출력에서 단정/평가 표현 자동 검수
- 신규 `expression_filter.py`: 금지어 사전 + attribution 변환
- `issue-card.tsx` / `issue-detail-page.tsx`: "확정 전" 라벨 UI

### 구현 예시

```python
# expression_filter.py
BANNED_ADJECTIVES = ["부패한", "무능한", "악의적", "비열한", "사악한", "매국"]
ATTRIBUTION_PATTERNS = {
    "뇌물을 받았다": "뇌물 수수 혐의로 기소됐다",
    "거짓말을 했다": "사실과 다른 발언을 한 것으로 확인됐다",
    "범죄를 저질렀다": "혐의를 받고 있다",
}
```

### 내 의견

**이건 반드시 해야 한다.** 법적 안전망의 핵심이자 플랫폼 신뢰도의 기반.
다만 AI summary에 대해서만 적용하고, 원문 출처 링크는 그대로 유지.

---

## 6. 정치인 페이지 — "행보 Archive"로 전환

### 현재

```
프로필 + 3열 점수 요약 (감점/가점/순점수) + 카테고리별 분석 + 관련 이슈
→ 사실상 "개인 종합 점수"
```

### v1.1

```
개인 종합 점수 절대 X.
프로필 + 관련 이슈 목록 (점수 있는 이슈만 점수 표시) + 행보 타임라인 + 본인 발언 모음 + 입법 활동
→ "이 사람이 뭘 했는지" archive
```

### 수정 범위

| 파일 | 변경 |
|------|------|
| `politicians/[id]/page.tsx` | 3열 점수 요약 제거, 행보 타임라인으로 대체 |
| `politicians/page.tsx` | 정치인 목록에서 점수 표시 제거 |
| `data.ts` | 정치인별 archive 이슈 조회 함수 추가 |

### 내 의견

**정치인 개인 점수 완전 삭제가 맞다:**
- 개인 점수는 명예훼손 직행. 3열 점수 요약, 순점수, 카테고리별 합산 전부 제거
- 이슈 목록만 보여주고, 각 이슈에 점수가 표시되어 있으므로 사용자가 스스로 판단
- "이 사람이 뭘 했는지" archive일 뿐, 우리가 사람을 평가하지 않는다

---

## 7. 본인 반론권 — 신규 시스템

### v1.1 설계 (자동 추적 모델)

```
직접 반론 폼 X (사칭 위험)
본인 입장 자동 수집:
  - 본인 공식 SNS (사전 등록 + verified)
  - 국회 회의록·상임위 발언
  - 의원실 공식 보도자료
  - 매체 인터뷰·기자회견 인용
```

### 수정 범위

- DB: `politician_responses` 테이블 신규
- 크롤러: 정치인 SNS 모니터링 모듈 신규
- 프론트: 이슈 상세에 "본인 입장" 섹션 추가
- `politicians/[id]`: "본인 발언 모음" 탭 추가

### 내 의견

**Phase 2~3 범위. 지금은 "본인 입장 확인되지 않음" 문구만 넣어두자.**

SNS 자동 추적은:
- X(트위터) API = 유료 ($100/월~)
- Facebook/Instagram = 모니터링 불가 (API 제한)
- 현실적으로 "네이버 검색에서 정치인 이름 + 반론/해명/입장" 검색이 최선

---

## 8. 파이프라인 재설계 — 핵심

### 현재 흐름 (기사 단위)

```
기사 1건 수집 → AI 분류 → 검증 → 저장
→ 교차검증이 구조적으로 불가능 (비교 대상이 없음)
```

### v1.1 흐름 (이슈 클러스터 단위)

```
[1] 다중 소스 동시 수집 (Tier 1~3 전부)
[2] 이슈 클러스터링 (같은 사건 묶기)
[3] 클러스터 단위로 신뢰도 게이트 (매체 다양성·costly signal 등)
[4] AI 분류 (클러스터 대표 기사 기준)
[5] 점수 산출 (보도량·공식처리·지속일수)
[6] 저장
[7] 오보 감사
```

### 수정 범위

- `main.py` 전면 재작성
- 신규 `clusterer.py`: 이슈 클러스터링 엔진
- 신규 `trust_gate.py`: 신뢰도 게이트 (cross_verify + auto_verify 통합)
- `analyzer.py`: 클러스터 대표 기사 기반 분류로 변경
- `scorer.py`: v1.1 점수 공식으로 재작성

---

## 9. DB 스키마 변경

### 새로 필요한 컬럼/테이블

```sql
-- issues 테이블 수정
ALTER TABLE issues ADD COLUMN trust_level TEXT DEFAULT 'pending';  -- high/medium/low/pending
ALTER TABLE issues ADD COLUMN criminal_stage TEXT;  -- indicted/suspended/guilty_1st/guilty_2nd/confirmed/pardoned
ALTER TABLE issues ADD COLUMN coverage_count INTEGER DEFAULT 1;
ALTER TABLE issues ADD COLUMN headline_days INTEGER DEFAULT 1;
ALTER TABLE issues ADD COLUMN is_archive BOOLEAN DEFAULT false;
ALTER TABLE issues ADD COLUMN position_weight NUMERIC DEFAULT 0.8;

-- 이슈 클러스터 테이블 (신규)
CREATE TABLE issue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_issue_id UUID REFERENCES issues(id),
  issue_count INTEGER DEFAULT 1,
  media_diversity_score NUMERIC,
  trust_level TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 클러스터-이슈 매핑
CREATE TABLE cluster_issues (
  cluster_id UUID REFERENCES issue_clusters(id),
  issue_id UUID REFERENCES issues(id),
  PRIMARY KEY (cluster_id, issue_id)
);

-- 정치인 반론 (신규)
CREATE TABLE politician_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID REFERENCES politicians(id),
  issue_id UUID REFERENCES issues(id),
  source_url TEXT NOT NULL,
  source_type TEXT,  -- sns/press_release/interview/parliament
  content TEXT,
  collected_at TIMESTAMPTZ DEFAULT now()
);

-- politicians 테이블 수정
ALTER TABLE politicians ADD COLUMN position_weight NUMERIC DEFAULT 0.8;
ALTER TABLE politicians ADD COLUMN official_sns JSONB DEFAULT '[]';  -- [{platform, url, verified}]
```

---

## 10. Phase 1 즉시 실행 — 우선순위 + 예상 작업량

| # | 작업 | 영향도 | 난이도 | 예상 |
|---|------|--------|--------|------|
| 1 | **카테고리 사전 v1.1** (점수 6 + archive 5) | 최고 | 중 | 2시간 |
| 2 | **신뢰도 게이트 룰 코드화** | 최고 | 상 | 4시간 |
| 3 | **점수 공식 v1.1** | 최고 | 상 | 3시간 |
| 4 | **검찰 처분 6종 로직** | 높음 | 중 | 2시간 |
| 5 | **표현 자동 검수 룰** | 높음 | 중 | 2시간 |
| 6 | **매체 진영 매핑 확대** | 중간 | 하 | 30분 |
| 7 | **정치인 페이지 → archive 전환** | 중간 | 중 | 2시간 |
| 8 | **방법론 페이지 재작성** | 중간 | 중 | 2시간 |
| 9 | **기존 214건 삭제 + DB 스키마 마이그레이션** | 필수 | 하 | 30분 |
| 10 | **파이프라인 재설계 (클러스터 기반)** | 최고 | 최상 | 8시간 |

### 권장 순서

```
Day 1: #9 (DB 정리) → #1 (카테고리) → #6 (매체 매핑)
Day 2: #3 (점수 공식) → #4 (검찰 처분)
Day 3: #2 (신뢰도 게이트) → #5 (표현 검수)
Day 4: #10 (파이프라인 재설계)
Day 5: #7 (정치인 페이지) → #8 (방법론)
```

---

## 11. 명시적으로 안 하는 것 — 코드에서 제거해야 할 것

| 현재 코드 | 제거/변경 |
|-----------|-----------|
| `isPositive` 플래그 | 제거 — 가점/감점 이분법 폐기 |
| `bluePositive/redPositive` 계산 | 제거 — 점수 카테고리만 합산 |
| `perCapita` 계산 | 유지 — 1인당 평균은 v1.1에도 있음 |
| `charity` 카테고리 | 제거 — 선행은 점수화 안 함 |
| `promise_kept/broke` | 제거 — 공약은 archive |
| `policy_win/fail` | 제거 — 정책은 archive (감사원 적발 제외) |
| 정치인 3열 점수 요약 | 제거 — 개인 종합 점수 X |
| "TOP 10" 같은 랭킹 | 현재도 없음 — 앞으로도 금지 |

---

## 12. 결론

v1.1 설계는 현재 코드 대비 **철학적 전환**이 필요:

```
현재: "나쁜 짓에 감점, 좋은 일에 가점" → 우리가 판단
v1.1: "공식 기관이 처분한 것만 측정" → 사회가 판단, 우리는 기록
```

이 전환이 가져오는 코드 변경량은 크지만, **핵심 인프라(Supabase, Next.js, 크롤러 구조)는 재활용 가능**. 카테고리·점수·검증 로직을 교체하는 거지, 처음부터 다시 만드는 건 아니야.

**"공식 처분만 점수"의 장점:** 점수가 붙으면 진짜 무거운 거라는 인식이 생긴다. 형사 유죄/기소유예, 민사 패소, 윤리위·선관위 처분, 감사원·국정감사 적발, IFCN false 판정, 본인 시인/사과 — 연간 충분한 건수가 나온다. 막말·논란·정책 호불호는 archive로 원문 보존하되 점수화하지 않아 법적 리스크도 줄인다.
