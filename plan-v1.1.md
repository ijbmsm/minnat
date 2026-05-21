# 민낯 v1.1 — 구현 계획서

> "우리는 점수 매기지 않는다. 사회·제도의 반응을 측정만 한다."
> 참고: /docs/direction-research.md

---

## Phase 0: 정리 (30분)

- [ ] Supabase issues 테이블 전체 삭제 (`TRUNCATE issues CASCADE;`)
- [ ] score_snapshots 전체 삭제
- [ ] DB 마이그레이션 실행:
  - category CHECK 제약조건 교체 (점수 6 + archive 5 + 입법 5)
  - trust_level, criminal_stage, coverage_count, headline_days, is_archive, position_weight 컬럼 추가
  - issue_clusters, cluster_issues, politician_responses 테이블 생성
  - politicians에 position_weight, official_sns 컬럼 추가

---

## Phase 1: 코어 재설계 (Day 1~2)

### Step 1. 카테고리 사전 v1.1 --- DONE

- [x] 프론트 타입 교체 (`types/index.ts`):
  ```
  점수 카테고리:
    criminal_conviction  — 형사 유죄 (단계별 가중치)
    civil_judgment       — 민사 패소
    ethics_violation     — 윤리위·선관위 처분
    factcheck_false      — IFCN false 판정
    self_admission       — 본인 공식 시인·사과
    official_misconduct  — 감사원·국정감사 적발

  Archive 카테고리 (점수 X):
    controversial_statement — 막말·논란 발언
    policy_record          — 발의·표결 이력
    attendance_record      — 출석률
    media_coverage         — 보도 모음
    politician_sns         — 본인 SNS·삭제 게시물

  입법 기록 (점수 X):
    bill_proposed → bill_committee → bill_plenary → bill_promulgated → bill_enforced
  ```
- [x] `constants.ts` 전면 교체: isPositive 제거 → isScored/isArchive
- [x] `config.py` 동기화

### Step 2. 검찰 처분 6종 --- DONE + 형사 단계 가중치

- [x] `config.py`에 CRIMINAL_STAGE_WEIGHT:
  ```
  수사 착수    → 0 (기록만)
  기소         → 2
  기소유예     → 1.5
  1심 유죄     → 4
  2심 유죄     → 6
  대법 확정    → 10
  사면         → 점수 유지
  혐의없음     → 0 (UI 숨김)
  무죄         → 0 (UI 숨김)
  ```
- [x] DB `criminal_stage` 컬럼 활용
- [x] `analyzer.py` 프롬프트에 형사 단계 판정 추가

### Step 3. 점수 공식 v1.1 --- DONE

- [x] `score.ts` 전면 재작성:
  ```
  base_score = coverage_count_norm × 0.40
             + official_stage × 0.35
             + headline_days_norm × 0.25

  final = base_score
          × media_diversity_multiplier (0.7~1.3)
          × position_weight (0.5~1.2)
  ```
- [x] `scorer.py` 동기화
- [x] 시간 감쇠 4개 뷰 유지 (hot/recent/midterm/alltime)

### Step 4. 신뢰도 게이트 재설계 --- DONE

- [x] 신규 `trust_gate.py` (cross_verify + auto_verify 통합):
  ```
  HIGH (즉시 verified):
    - 자기 진영 매체가 자기 진영 비판 + 다수 매체
    - 좌+중+우 매체 다양 보도
    - 본인 공식 시인·사과
    - 공식 기관 처분 (검찰·법원·윤리위·감사원·선관위)
    - 다중 매체 + 물증 키워드 ("영상 공개", "녹취록")

  LOW (보류):
    - 반대 진영 매체 단독 보도
  ```
- [x] costly signal 감지: 매체 성향(MEDIA_LEAN) + actor camp 비교
- [x] `validator.py` 재작성

### Step 5. 표현 자동 검수 --- DONE

- [x] 신규 `expression_filter.py`:
  - 금지 형용사 사전 ("부패한", "무능한", "악의적" 등)
  - 단정→attribution 자동 변환
  - "확정 전" 라벨 자동 부착 (criminal_stage가 confirmed 아닌 경우)
- [x] AI summary에 적용 (원문 출처 링크는 그대로)

### Step 6. 매체 진영 매핑 확대 --- DONE

- [x] `config.py` MEDIA_LEAN 확대:
  ```
  진보: 한겨레, 경향신문, 오마이뉴스, 프레시안, 민중의소리
  중도: KBS, MBC, SBS, 연합뉴스, JTBC, YTN, 뉴시스, 한국일보
  보수: 조선일보, 중앙일보, 동아일보, 채널A, TV조선, 문화일보, 세계일보
  ```
- [x] `media_camp_mapping.yaml` (config.py에 포함) GitHub 공개용 파일 작성

---

## Phase 2: 파이프라인 재설계 (Day 3~4)

### Step 7. 이슈 클러스터링 엔진

- [ ] 신규 `clusterer.py`:
  - 수집된 전체 기사를 제목+요약 유사도로 클러스터링
  - 같은 이슈 묶기 (유사도 >= 0.55 또는 actor+category 일치)
  - 클러스터별 대표 기사 선정 (가장 긴 요약)
  - 클러스터별 매체 목록, 진영 다양도, 보도량 자동 계산

### Step 8. main.py 전면 재작성 --- DONE

- [ ] 새 파이프라인:
  ```
  [0] 정치인 DB 동기화
  [1] 다중 소스 동시 수집 (Tier 1~3 전부)
  [2] 전체 기사 → 이슈 클러스터링
  [3] 클러스터별 신뢰도 게이트
  [4] verified 클러스터만 → AI 분류 (대표 기사 기준)
  [5] 점수 산출 (보도량·공식처리·지속일수)
  [6] 표현 자동 검수
  [7] DB 저장 (이슈 + 클러스터)
  [8] 미검증 이슈 자동 승격 (이전 실행 데이터와 비교)
  [9] 스냅샷 생성
  ```

### Step 9. 크롤러 소스 정비

- [ ] Tier 1: 국회 의안정보 통합 API (ALLBILL) — 공공데이터포털 키 연동
- [ ] Tier 1: 국회의원 정보 통합 API (ALLNAMEMBER) — 동일 키
- [ ] Tier 2: 네이버 팩트체크 aggregator 크롤러 (신규)
- [ ] Tier 3: 네이버 검색 API (유지)
- [ ] Tier 3: RSS (유지 + 매체 확대)
- [ ] 감사: 네이버 오보 목록 크롤러 (신규)
- [ ] 제거: SNU 팩트체크 (이미 제거됨)
- [ ] 제거: 법원 크롤러 (302 에러, API 키 발급 후 재추가)

---

## Phase 3: 프론트엔드 전환 (Day 4~5)

### Step 10. 메인 스코어보드 수정 --- DONE

- [ ] 가점/감점 분리 제거 → 점수 카테고리 합산만
- [ ] "진행 중" vs "확정" 이원화:
  - 메인 뷰: 확정 이슈만 풀 점수
  - 별도 탭: 진행 중 이슈 (작은 점수 + "확정 전" 라벨)
- [ ] 결론 문구 없음, 그래프만

### Step 11. 이슈 카드/상세 페이지 --- DONE

- [ ] archive 이슈: 점수 표시 X, "archive" 뱃지
- [ ] 형사 이슈: 단계 표시 (수사→기소→1심→2심→확정)
- [ ] "본인 입장 확인되지 않음" 문구 기본 표시
- [ ] 점수 근거: v1.1 공식 (보도량·공식처리·지속일수) 표시

### Step 12. 정치인 페이지 --- DONE → 행보 Archive

- [ ] 개인 점수 완전 제거 (3열 요약, 순점수, 카테고리 합산 전부)
- [ ] 관련 이슈 목록 (점수 있는 건 점수 표시, archive는 표시만)
- [ ] 입법 활동 타임라인
- [ ] "본인 입장 확인되지 않음" 기본 문구

### Step 13. 방법론 페이지 재작성 --- DONE

- [ ] v1.1 철학: "사회·제도의 반응 측정"
- [ ] 점수 카테고리 6개 정의 + 근거
- [ ] archive 카테고리 5개 정의
- [ ] 점수 공식 v1.1 전체 공개
- [ ] 신뢰도 게이트 룰 공개
- [ ] 검찰 처분 6종 처리 기준
- [ ] 매체 진영 매핑 공개 (yaml 링크)
- [ ] 한계 솔직 공개

---

## Phase 4: 역사 데이터 수집 (Day 5~7)

### Step 14. 기존 데이터 전체 삭제

- [ ] `TRUNCATE issues, score_snapshots, issue_clusters, cluster_issues CASCADE;`

### Step 15. 시드 스크립트 v2 --- DONE (v1.1 카테고리 기반)

- [ ] `seed_historical.py` 전면 재작성:
  - v1.1 카테고리로 분류
  - 형사 단계 판정 포함
  - archive/scored 분리
  - verified=True (역사 데이터)
- [ ] 검색 키워드 교체:
  ```
  "{year}년 국회의원 유죄 판결"
  "{year}년 정치인 기소"
  "{year}년 정치인 벌금"
  "{year}년 윤리위 징계"
  "{year}년 선관위 처분"
  "{year}년 감사원 적발"
  "{year}년 정치인 사과"
  "{year}년 팩트체크 거짓"
  "{year}년 정치인 막말" (archive)
  "{year}년 국회 법안 통과" (archive)
  ```

### Step 16. 연도별 수집 실행

- [ ] GitHub Actions seed 워크플로우 실행:
  - 1차: 2020~2025 (최근, 데이터 풍부) — limit 30/년
  - 2차: 2010~2019 (중간) — limit 20/년
  - 3차: 1999~2009 (초기, 커버리지 약함) — limit 15/년
- [ ] 예상: ~700건, API 비용 ~$5
- [ ] 수집 후 편향 감사 (bias_audit.py) 실행

---

## Phase 5: 검증 + 론칭 (Day 7~10)

### Step 17. 데이터 품질 검증

- [ ] 편향 감사: 진영별 점수 분포, Welch's t-test
- [ ] 카테고리 분포 확인 (archive vs scored 비율)
- [ ] 형사 단계 분포 확인
- [ ] 매체 다양성 확인

### Step 18. Closed Alpha

- [ ] 과거 6개월 데이터 시뮬레이션
- [ ] 명백한 오류 잡기
- [ ] 방법론 페이지 최종 검토

### Step 19. 배포

- [ ] Vercel 재배포
- [ ] 크롤러 v1.1 cron 정상 작동 확인
- [ ] "BETA" 라벨 표시
- [ ] "데이터·룰 개선 중" 명시

---

## 명시적으로 안 하는 것

- 정치인 개인 종합 점수
- 정치인 랭킹 (TOP 10 등)
- "X당이 더 나쁘다" 결론 문구
- 막말·위선·정책 호불호 점수화
- 표결 점수화 (의견은 점수 X)
- 법안 통과 자체 가점
- 익명 반론 폼
- SNS 시민 반응 점수
- 추측·평가·단정 표현

---

## 예상 일정

| Day | 작업 | 예상 시간 |
|-----|------|-----------|
| 1 | Phase 0 (정리) + Step 1~2 (카테고리+검찰) | 3시간 |
| 2 | Step 3~6 (점수+게이트+검수+매체) | 4시간 |
| 3 | Step 7~8 (클러스터+파이프라인) | 4시간 |
| 4 | Step 9 (소스 정비) + Step 10~11 (프론트) | 4시간 |
| 5 | Step 12~13 (정치인+방법론) + Step 14~15 (시드) | 3시간 |
| 6 | Step 16 (수집 실행) | 대기 |
| 7 | Step 17~19 (검증+배포) | 2시간 |

**총 ~20시간, 풀 집중 5~7일**
