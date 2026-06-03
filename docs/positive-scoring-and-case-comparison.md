# 긍정 이슈 감경 시스템 + 유사 사례 비교 기능 설계

> 작성일: 2026-05-27
> 목적: 민낯 v2 핵심 기능 두 가지의 구조 설계, 비용 산출, 구현 계획

---

## 1. 현황 분석

### 현재 점수 체계

민낯은 **부정적 공식 처분만** 점수화하는 구조:

| 구분 | 카테고리 | 점수 |
|------|---------|------|
| 점수 (6개) | criminal_conviction, civil_judgment, ethics_violation, factcheck_false, self_admission, official_misconduct | base × diversity × position × decay |
| Archive (6개) | controversial_statement, policy_record, attendance_record, media_coverage, politician_sns, social_controversy | 0 |
| 입법 (5개) | bill_proposed → bill_enforced | 0 |

**점수 공식 (v1.1):**
```
base = coverage_norm(×0.40) + stage_norm(×0.35) + headline_norm(×0.25)
final = base × media_diversity(0.7~1.3) × position_weight(0.5~1.2) × time_decay
```

### 문제점

1. **"부정만 보여주면 플랫폼 자체가 편향"** — 사용자가 판단할 양면 데이터가 없음
2. **학술 근거**: 정치 평가에서 긍정적 정보가 실제 투표 결정에 더 큰 영향 (PMC 연구)
3. **경쟁 플랫폼 대비 차별화 부족** — 정치랭크, K-Assembly 등은 이미 다면 평가 제공

### 현재 DB 구조 (변경 필요 부분)

```
issue_clusters (이벤트)
├── category: IssueCategory (17종, 전부 부정/중립)
├── weighted_score: number
├── criminal_stage: CriminalStage | null
├── embedding: vector(1536) ← 유사 사례 비교에 활용 가능
└── cross_verified_sources: JSONB

issues (개별 기사)
├── category, weighted_score, criminal_stage
├── ai_analysis: JSONB {confidence, reasoning, ...}
└── coverage_count, headline_days
```

---

## 2. 외부 사례 조사

### 2.1 해외 정치 플랫폼

| 플랫폼 | 접근 방식 | 긍정/부정 구분 | 시사점 |
|--------|----------|--------------|--------|
| **GovTrack** (미국) | 행동 통계만 (법안 수, 출석률, 리더십 점수) | 구분 없음 — 수치만 제시 | 가치 판단 회피, 데이터만 |
| **OpenSecrets** (미국) | 캠페인 자금 투명성 | 구분 없음 | 투명성 자체가 지표 |
| **VoteSmart** (미국) | "정치적 용기 테스트" — 입장 공개 의지 | 공개 여부만 | 행동 자체를 측정 |
| **정치랭크** (한국) | 7개 지표 100점 (출석25 + 입법20 + 진척15 + 성과20 + 뉴스10 + 경력5 + 국민평가5) | 암묵적 긍정 지표 | 정량 데이터 기반 |
| **K-Assembly** (한국) | 출석 + 입법활동 모니터링 | 활동량 = 긍정 | 공공 API 활용 |

**핵심 인사이트**: 대부분의 플랫폼은 긍정/부정을 **명시적으로 나누지 않음**. 행동 데이터를 제시하고 해석은 사용자에게 맡김. 민낯이 "감경"이라는 프레임으로 가는 건 **독자적인 포지셔닝**.

### 2.2 ESG 스코어링 (구조적 유사성)

ESG 평가 시스템은 정치 점수와 구조적으로 유사:

- **극성 태깅**: 각 지표에 명시적 긍정/부정 태그 → 민낯도 카테고리별 극성 필요
- **기준선 접근**: 중립 50점에서 시작, 초과 성과는 가산, 미달은 감산
- **물질성 가중치**: 산업별로 중요도가 다름 → 정치인 직책별로 가중치가 다름 (이미 position_weight로 구현)
- **경고**: ESG 점수의 60%가 실적이 아닌 "약속"에 기반 → **검증 가능한 행동만** 점수화해야 함

### 2.3 양형기준 (감경 모델의 법적 근거)

대한민국 양형위원회의 감경 인자 체계는 민낯의 감경 모델에 **가장 직접적인 참고 자료**:

#### 양형기준 2단계 인자 체계

| 구분 | 영향도 | 예시 |
|------|--------|------|
| **특별감경인자** | 형량 범위 자체를 이동 | 자수, 피해회복(2/3 이상), 처벌불원, 진지한 반성 |
| **일반감경인자** | 범위 내에서 조정 | 경미한 피해, 초범, 사회적 유대 |

#### 핵심 개념 차용

- **"진지한 반성"의 정의**: "범행을 인정한 구체적 경위, 피해회복 또는 재범방지를 위한 자발적 노력 여부 등을 조사, 판단한 결과 피고인이 자신의 범행을 진심으로 뉘우치고 있다고 인정되는 경우" (2024년 양형위원회 신설)
- **피해 회복 2/3 기준**: 재산적 피해의 약 2/3 이상 회복 시 실질적 피해 회복으로 인정
- **특별감경 2개 이상**: 최저형의 1/2까지 감경 가능

**민낯 적용**: 정치인의 긍정적 행위도 "특별 감경"과 "일반 감경"으로 나누고, 검증 가능한 공식 기록만 인정

### 2.4 공직선거법 제약

**중요**: 공직선거법 제112조에 따라 정치인의 기부/선행은 법적으로 제한됨:

- 국회의원, 지방의원, 단체장, 후보자 및 배우자는 **상시적으로** 선거구민에게 기부 금지
- "업적"을 공표하는 것 자체가 불법 선거운동에 해당할 수 있음
- 따라서 **"세비 기부", "불우이웃 돕기"** 같은 항목은 **합법성 확인 후에만** 긍정 카테고리로 분류 가능

#### 안전한 긍정 카테고리 (팩트 검증 가능 + 합법)

| 카테고리 | 데이터 소스 | 검증 가능성 |
|---------|-----------|------------|
| 입법 성과 (법안 가결) | 국회 Open API | 높음 |
| 출석률 | 국회 공개 데이터 | 높음 |
| 국정감사 질의 | 회의록 | 높음 |
| 재산 공개 이행 | 관보 | 높음 |
| 윤리 무위반 기록 | 윤리위 기록 | 높음 |
| 자수/내부고발 | 수사기관 발표 | 높음 |
| 피해 회복/합의 | 법원 기록 | 높음 |

#### 위험한 카테고리 (주관적 or 불법 소지)

| 카테고리 | 문제점 |
|---------|--------|
| 자선 기부 | 공직선거법 위반 가능 |
| "좋은" 정책 입장 | 주관적 |
| SNS 소통 빈도 | 양과 질 혼동 |
| 미디어 출연 | 정량화 어려움 |

---

## 3. 기능 설계: 긍정 이슈 감경 시스템

### 3.1 설계 철학

> "상쇄가 아니라 감경. 법원도 양형에서 반성과 사회공헌을 감경 사유로 본다. 민낯은 그걸 데이터로 시각화할 뿐."

**원칙:**
1. 부정 점수 자체는 **절대 삭제/감소하지 않음** — 원본 보존
2. 감경은 **별도 트랙**으로 기록, 최종 표시에서만 반영
3. 감경 근거는 **투명하게 공개** — 어떤 긍정 행위가 얼마나 감경했는지 표시
4. **공식 기록만** 인정 — 검증 불가능한 선행은 archive

### 3.2 감경 카테고리 체계

양형기준의 2단계 인자 체계를 차용:

#### 특별 감경 카테고리 (강한 영향)

| 카테고리 ID | 라벨 | 감경 가중치 | 조건 |
|------------|------|-----------|------|
| `damage_recovery` | 피해 회복 | 0.30 | 민사 배상 완료, 합의, 공식 사과 + 실질 조치 |
| `voluntary_surrender` | 자수/자진 신고 | 0.25 | 수사기관 발표로 확인 |
| `whistleblowing` | 내부 고발 | 0.25 | 공익신고자 인정 |
| `legislative_achievement` | 입법 성과 | 0.20 | 대표 발의 법안 본회의 가결 (국회 API) |

#### 일반 감경 카테고리 (보통 영향)

| 카테고리 ID | 라벨 | 감경 가중치 | 조건 |
|------------|------|-----------|------|
| `full_attendance` | 출석 우수 | 0.10 | 본회의 + 상임위 출석률 95% 이상 |
| `asset_disclosure` | 재산 투명 공개 | 0.08 | 법정 의무 초과 공개 |
| `ethics_clean` | 윤리 무위반 | 0.08 | 임기 내 징계 0건 |
| `oversight_active` | 감사 활동 우수 | 0.10 | 국정감사 질의 상위 20% |
| `donation_legal` | 합법적 사회공헌 | 0.10 | 공직선거법 범위 내, 공익재단 설립 등 |

### 3.3 감경 점수 공식

```
gross_score = 기존 부정 점수 (변경 없음)

credit_score = Σ(credit_base × credit_diversity × verification_tier)
  credit_base     = credit_weight × coverage_norm × recency_factor
  credit_diversity = 0.7 (단독 보도) | 1.0 (2개 진영) | 1.3 (3개 진영)
  verification_tier = 1.0 (공식기관) | 0.8 (팩트체크) | 0.5 (언론)

net_score = gross_score × max(0.3, 1 - credit_ratio)
  credit_ratio = credit_score / gross_score (최대 0.7 = 70% 감경 캡)
```

**감경 상한**: 최대 70% 감경. 아무리 좋은 일을 많이 해도 공식 처분 점수의 30%는 남음.

**양형기준 참고**: 특별감경인자 2개 이상이면 최저형 1/2 감경이 한계인 것처럼, 민낯도 감경 캡을 둠.

### 3.4 UI 표시 방식

```
┌─────────────────────────────────────┐
│  [형사 유죄]            점수 42.5   │ ← gross_score (원본, 취소선 없음)
│                                     │
│  김OO — 공직선거법 위반 벌금형       │
│                                     │
│  ──────────────────────────────────  │
│                                     │
│  감경 내역 (-12.8)                  │ ← credit 상세
│  ├ 피해 회복: 벌금 완납 + 사과      │   -8.5 (공식 기록)
│  └ 입법 성과: 3건 본회의 가결       │   -4.3 (국회 API)
│                                     │
│  실질 점수: 29.7                    │ ← net_score
└─────────────────────────────────────┘
```

메인 스코어보드에서는:
- **기본 모드**: net_score(감경 반영) 기준 비율 표시
- **토글**: "감경 전/후" 비교 스위치 — gross vs net 전환 가능
- 감경 적용 시 점수 옆에 작은 화살표 (↓12.8) 표시

### 3.5 DB 스키마 변경

```sql
-- 새 테이블: 감경 이벤트
CREATE TABLE credit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- 연결
  target_event_id UUID REFERENCES issue_clusters(id),  -- 감경 대상 부정 이벤트
  actor_name TEXT,
  camp camp_type NOT NULL,
  -- 분류
  credit_category TEXT NOT NULL,  -- damage_recovery, voluntary_surrender, etc.
  credit_tier TEXT NOT NULL DEFAULT 'general',  -- 'special' | 'general'
  credit_weight NUMERIC NOT NULL DEFAULT 0.1,
  -- 검증
  source_tier INTEGER NOT NULL DEFAULT 3,
  source_url TEXT,
  source_name TEXT,
  verified BOOLEAN DEFAULT false,
  trust_level trust_level_type DEFAULT 'pending',
  cross_verified_sources JSONB DEFAULT '[]',
  -- 메트릭
  coverage_count INTEGER DEFAULT 1,
  -- 내용
  summary TEXT,
  ai_analysis JSONB,
  -- 메타
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  embedding vector(1536)
);

-- issue_clusters에 감경 관련 컬럼 추가
ALTER TABLE issue_clusters ADD COLUMN credit_score NUMERIC DEFAULT 0;
ALTER TABLE issue_clusters ADD COLUMN net_score NUMERIC;  -- weighted_score × max(0.3, 1 - credit_ratio)

-- 인덱스
CREATE INDEX idx_credit_events_target ON credit_events(target_event_id);
CREATE INDEX idx_credit_events_actor ON credit_events(actor_name);
CREATE INDEX idx_credit_events_camp ON credit_events(camp);
```

### 3.6 크롤러 변경 사항

**새 분류 파이프라인:**
1. 기존 분류에서 "긍정적 행위" 감지 시 credit_events로 분류
2. AI 프롬프트에 감경 카테고리 추가
3. `target_event_id` 자동 매칭: 같은 actor_name + 관련 부정 이벤트 탐색
4. 매칭 안 되면 `target_event_id = null` (독립 감경 기록)

**국회 API 연동 (신규):**
- 열린국회정보 API로 출석률, 법안 발의/가결 데이터 자동 수집
- 주기: 주 1회 cron
- 감경 카테고리 자동 생성: `full_attendance`, `legislative_achievement`

---

## 4. 기능 설계: 유사 사례 비교 시스템

### 4.1 설계 철학

> "유사 사건이라고 단정하지 않는다. 같은 카테고리의 다른 사건을 데이터로 나열할 뿐, 형평성 판단은 사용자 몫."

**원칙:**
1. **"유사 사건"이 아닌 "같은 카테고리 사건"**으로 표현
2. 처벌 비교에 **"법원/검찰의 판단"** 출처 명시
3. 플랫폼이 "이게 불공정하다" 절대 안 말함
4. 하단 고정 문구: "사건의 세부 맥락은 다를 수 있습니다"

### 4.2 유사도 매칭 방식: 하이브리드

법률 AI 분야의 베스트 프랙티스를 참고한 3단계 매칭:

```
1단계: 카테고리 필터 (구조적 매칭)
   → category 일치 + criminal_stage 유사도

2단계: 임베딩 유사도 (의미적 매칭)
   → issue_clusters.embedding 간 cosine similarity
   → pgvector의 <=> 연산자 사용

3단계: 가중 결합
   → final_similarity = 0.4 × category_score + 0.6 × embedding_similarity
```

#### 카테고리 점수 계산

```typescript
function categoryScore(a: IssueEvent, b: IssueEvent): number {
  let score = 0;

  // 같은 카테고리: +0.4
  if (a.category === b.category) score += 0.4;

  // 같은 criminal_stage: +0.3
  if (a.criminal_stage && a.criminal_stage === b.criminal_stage) score += 0.3;

  // 같은 직책 범위: +0.15
  if (Math.abs((a.position_weight || 0.8) - (b.position_weight || 0.8)) <= 0.2) score += 0.15;

  // 다른 진영: +0.15 (교차 비교가 더 의미 있음)
  if (a.camp !== b.camp) score += 0.15;

  return score;
}
```

#### 임베딩 유사도 (pgvector)

```sql
-- 유사 사건 조회 (같은 카테고리 + 임베딩 유사도)
SELECT
  ic.*,
  1 - (ic.embedding <=> $1) AS similarity
FROM issue_clusters ic
WHERE ic.category = $2
  AND ic.id != $3
  AND ic.embedding IS NOT NULL
ORDER BY ic.embedding <=> $1
LIMIT 5;
```

### 4.3 UI: 유사 사례 카드

이슈 상세 페이지(`/issues/[id]`) 하단에 추가:

```
┌─────────────────────────────────────────────┐
│  같은 카테고리 사건 비교                      │
│                                              │
│  현재 사건                                    │
│  ├ 김OO · 공직선거법 위반 · 벌금 150만원      │
│  └ 2026.03 · 1심 · 유사도 기준점              │
│                                              │
│  ─────────────────────────────────────────── │
│                                              │
│  ┌──────────────┐  ┌──────────────┐          │
│  │ 이OO (2023)  │  │ 박OO (2021)  │          │
│  │ 같은 혐의     │  │ 같은 혐의     │          │
│  │ → 의원직 상실 │  │ → 무죄       │          │
│  │ 유사도: 87%   │  │ 유사도: 72%   │          │
│  │ [상세 보기]   │  │ [상세 보기]   │          │
│  └──────────────┘  └──────────────┘          │
│                                              │
│  ※ 사건의 세부 맥락은 다를 수 있습니다         │
└─────────────────────────────────────────────┘
```

### 4.4 DB 변경

기존 `issue_clusters.embedding` 컬럼이 이미 존재 (vector(1536)). 추가 스키마 불필요.

다만 현재 임베딩이 채워져 있는지 확인 필요. 비어있으면 크롤러에서 일괄 생성 작업 필요.

```sql
-- 임베딩 존재 여부 확인
SELECT
  COUNT(*) AS total,
  COUNT(embedding) AS with_embedding
FROM issue_clusters;

-- 유사도 검색 인덱스 (아직 없으면 생성)
CREATE INDEX IF NOT EXISTS idx_clusters_embedding
  ON issue_clusters USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 20);
```

### 4.5 API 엔드포인트

```typescript
// GET /api/events/[id]/similar
// 유사 사례 5건 반환

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const event = await getEventById(params.id);
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: similar } = await supabase.rpc('find_similar_events', {
    query_embedding: event.embedding,
    query_category: event.category,
    exclude_id: event.id,
    match_count: 5,
    similarity_threshold: 0.5,
  });

  return NextResponse.json({ similar });
}
```

```sql
-- Supabase RPC 함수
CREATE OR REPLACE FUNCTION find_similar_events(
  query_embedding vector(1536),
  query_category text,
  exclude_id uuid,
  match_count int DEFAULT 5,
  similarity_threshold float DEFAULT 0.5
)
RETURNS TABLE (
  id uuid,
  actor_name text,
  category text,
  camp text,
  criminal_stage text,
  summary text,
  weighted_score numeric,
  similarity float,
  last_reported_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ic.id,
    ic.actor_name,
    ic.category,
    ic.camp::text,
    ic.criminal_stage::text,
    ic.summary,
    ic.weighted_score,
    (1 - (ic.embedding <=> query_embedding))::float AS similarity,
    ic.last_reported_at
  FROM issue_clusters ic
  WHERE ic.id != exclude_id
    AND ic.embedding IS NOT NULL
    AND ic.category = query_category
    AND (1 - (ic.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY ic.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. 비용 산출

### 5.1 AI 비용 (월간)

| 항목 | 단가 | 예상 사용량 | 월 비용 |
|------|------|-----------|---------|
| **Claude Haiku 4.5** (감경 분류) | $1.00/MTok input, $5.00/MTok output | 1,000건 × 500tok input + 100tok output | ~$1 |
| **Claude Haiku 4.5** (배치 API) | 50% 할인 | 위와 동일 | ~$0.50 |
| **OpenAI text-embedding-3-small** | $0.02/MTok | 1,000건 × 300tok | ~$0.01 |
| **프롬프트 캐싱 적용 시** | input 90% 절감 | — | 추가 절감 |

**소계: ~$1~2/월** (분류 + 임베딩)

### 5.2 인프라 비용 (월간)

| 항목 | 현재 | 변경 후 | 추가 비용 |
|------|------|--------|----------|
| **Supabase** | Free (500MB) | Free 유지 가능 | $0 |
| **pgvector 저장** | ~60MB (10K 이벤트) | ~66MB (+credit_events) | 포함 |
| **Vercel** | Free/Hobby | 변경 없음 | $0 |
| **국회 API** | 미사용 | 무료 (공공 API) | $0 |

**소계: $0 추가** (현재 Free 티어로 충분)

### 5.3 개발 비용 (일회성)

| 작업 | 예상 소요 | 난이도 |
|------|----------|--------|
| DB 마이그레이션 (credit_events + RPC) | 2시간 | 낮음 |
| 크롤러 감경 분류 파이프라인 | 4시간 | 중간 |
| 국회 API 연동 (출석/입법) | 3시간 | 중간 |
| 프론트: 감경 UI (상세 페이지 + 스코어보드) | 4시간 | 중간 |
| 프론트: 유사 사례 비교 UI | 3시간 | 중간 |
| 점수 공식 수정 (net_score) | 2시간 | 낮음 |
| 임베딩 일괄 생성 (기존 데이터) | 1시간 | 낮음 |
| 테스트 + 디버깅 | 3시간 | — |

**소계: ~22시간** (Claude Code로 자동화 시 대폭 단축 가능)

### 5.4 총 비용 요약

| 구분 | 비용 |
|------|------|
| **월 운영비 추가** | ~$1~2 (AI API) + $0 (인프라) = **$1~2/월** |
| **초기 개발** | ~22시간 (인건비 별도) |
| **Supabase Pro 전환 시점** | 이벤트 80K건 초과 시 ($25/월) |

---

## 6. 구현 로드맵

### Phase 1: 유사 사례 비교 (먼저)

이유: 기존 데이터(임베딩)를 활용, 새 데이터 수집 불필요

1. 임베딩 존재 여부 확인 + 없으면 일괄 생성
2. `find_similar_events` RPC 함수 생성
3. `/api/events/[id]/similar` 엔드포인트
4. 이슈 상세 페이지에 "같은 카테고리 사건" 섹션 추가

### Phase 2: 감경 시스템 기초

1. `credit_events` 테이블 + 마이그레이션
2. 크롤러에 감경 카테고리 분류 추가
3. `credit_score`, `net_score` 계산 로직
4. 이슈 상세 페이지에 감경 내역 표시

### Phase 3: 국회 API 연동

1. 열린국회정보 API 연동 (출석률, 법안 데이터)
2. 자동 감경 이벤트 생성 (full_attendance, legislative_achievement)
3. 정치인 프로필 페이지에 의정활동 데이터 표시

### Phase 4: 스코어보드 반영

1. 메인 화면 점수에 net_score 반영
2. "감경 전/후" 토글 스위치
3. 진영별 감경 총량 비교

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|--------|------|------|
| "선행으로 범죄 세탁" 비판 | 신뢰도 하락 | 감경 캡 70%, gross_score 항상 표시, "상쇄 아닌 감경" 명시 |
| 긍정 데이터 편향 수집 | 한쪽 진영만 감경 | 국회 API 등 공식 데이터 우선, 수동 크롤링 최소화 |
| 공직선거법 충돌 | 법적 리스크 | 합법적 행위만 카테고리화, 위험 항목 archive 처리 |
| 유사 사례 오매칭 | 사용자 오해 | "유사 사건" 대신 "같은 카테고리", 면책 문구 상시 표시 |
| 임베딩 품질 | 부정확한 매칭 | threshold 0.5 이상만 표시, 카테고리 필터 병행 |

---

## 8. 참고 자료

### 플랫폼
- [GovTrack Report Cards](https://www.govtrack.us/congress/members/report-cards/2024)
- [정치랭크](https://www.jungchirank.co.kr/)
- [K-Assembly](https://www.kassembly.com/ranking/attendance)
- [열린국회정보](https://open.assembly.go.kr/)

### 학술/법률
- [Positive-Negative Asymmetry in Political Evaluation (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5835317/)
- [양형위원회 양형기준](https://sc.scourt.go.kr/sc/krsc/criterion/criterion_09/capture_01.jsp)
- [양형인자의 구분](https://sc.scourt.go.kr/sc/krsc/criterion/explan/stand/standard_02.jsp)
- [공직선거법 제112조](https://casenote.kr/%EB%B2%95%EB%A0%B9/%EA%B3%B5%EC%A7%81%EC%84%A0%EA%B1%B0%EB%B2%95/%EC%A0%9C112%EC%A1%B0)

### 기술
- [Legal Document Similarity with Transformers (PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11978053/)
- [LBox Korean Legal Benchmark (NeurIPS)](https://papers.neurips.cc/paper_files/paper/2022/file/d15abd14d5894eebd185b756541d420e-Paper-Datasets_and_Benchmarks.pdf)
- [LSEG ESG Scores Methodology](https://www.lseg.com/content/dam/data-analytics/en_us/documents/methodology/lseg-esg-scores-methodology.pdf)
- [Supabase pgvector Docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
