# 민낯 사주 — 빌드 플랜 v2

> 최초 작성: 2026-06-05 (v1 audit 기반)  
> 업데이트: 2026-06-05 (M0 전체 ✅, M1 전체 ✅, M2 핵심 ✅ 완료)

---

## 한 줄 위험 진단

> **`advanced.ts`(사령·합화·신강·격국·용신 = 가장 복잡 + 가장 heuristic)에 단위 테스트가 0개.**  
> 이게 단일 최대 리스크다. 앞으로 Phase 1·2 정밀화는 전부 `advanced.ts`를 건드리는데,  
> 테스트가 없으면 모든 수정이 러시안룰렛이다.  
> **여기 테스트를 먼저 박는 게 모든 후속 작업의 전제.**

---

## 프로덕션 파이프라인 (현재 실황)

```
API 라우트 (/api/saju/reading)
  → server.ts: calcSajuServer()
  → engine.ts: fromKST() + computeFourPillars()   ← offset=49 수정 완료 (2026-06-05)
  → seolgi-loader.ts: 이진탐색 버그 수정 완료
  → eot.ts: Spencer 균시차 + 진태양시
  → advanced.ts: analyzeAdvanced()                ← 테스트 0개 ← 최대 리스크
  → factsheet.ts: buildFactSheet()
  → AI 프롬프트
```

레거시(`pillars.ts` → `solar.ts`) 는 `index.ts`에만 남아 있고 프로덕션 미사용.

---

## M0 — 코어 락다운 (이번 주, ~1~2일)

엔진 버그는 사실상 다 잡혔다. 남은 건 **테스트 그물 + 청소**.

### ✅ M0.1 seyun 연도 KST 수정 (S) — 완료

`factsheet.ts` `new Date().getFullYear()` → KST 기준. 2줄.  
현재: UTC 기준이라 12/31 23:xx KST에서 내년 세운을 1년 일찍 전환.

```typescript
// 수정 전
const currentYear = new Date().getFullYear();

// 수정 후 (KST = UTC+9)
const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
const currentYear = kstNow.getUTCFullYear();
```

### ✅ M0.2 advanced.ts 단위 테스트 ★ (M) — 완료 (44케이스 all green)

**이게 없으면 이후 모든 수정이 불안전.**

필수 케이스:
```
[ ] 사령 — daysFromJie 0, 9, 10, 18, 30 경계 (각 당령신 다름)
[ ] 합화 성립 — dist≤2 + 月令 旺·相(계수≥1.2) → formed=true
[ ] 합화 불성립 — dist=3(원격) or 月令 미약 → formed=false
[ ] 신강 판정 — (일간+인성)/total > 0.58
[ ] 신약 판정 — < 0.42
[ ] 중화 판정 — 0.42~0.58 사이
[ ] 건록격 — 갑일간 + 寅月(mbIdx=2) → '건록격' + confidence='deterministic'
[ ] 양인격 — 갑일간 + 卯月(mbIdx=3) → '양인격' + confidence='deterministic'
[ ] 십신격 — 임일간 + 편재격(월령에 재성 사령) → 'deterministic'(투간시)/'heuristic'
[ ] 종격 가드 — 한 오행 ≥70% → 억부 부적용, dominant 오행 용신
[ ] 통근 — 甲일간, 寅·亥 포함 시 rootBonus 반영
```

### ✅ M0.3 골든 테스트셋 공백 메우기 (M) — 완료 (43케이스, +18 추가)

현재 25케이스 → 목표 40~50케이스.

```
[ ] 子月·丑月 월간 — 오호둔 5연간 × 子·丑 = 10케이스 (현재 子丑月 테스트 전무)
[ ] 경도 차이 — 부산(129°E) vs 인천(126.5°E) 시주 차이 확인
[ ] 음력 입력 — lunar.ts 변환 후 4주 검증
[ ] 1880 범위 — seolgi.json 조기 생년 정상 처리
[ ] 세운 간지 — makeSeyunPillar 10케이스 KASI 대조
[ ] 대운 교운나이 — 검증된 명식 3개 외부 교차검증
[ ] 입춘 ±30분 — boundary_caution 플래그 확인
[ ] 절입 ±30분 — 월주 boundary_caution
```

**DoD**: advanced + 골든 전체 green, `npm test` CI 게이트. 이 시점부터 "으악 루프" 종료.

### ✅ M0.4 레거시 정리 (S) — 완료

`index.ts buildSajuResult` / `pillars.ts` / `solar.ts`에 `@deprecated` 주석.  
프로덕션 미사용이지만 결과가 다른 코드가 export돼 있는 것 자체가 MEDIUM 리스크.

---

## M1 — 무료 출시 (2~3주)

출시를 진짜 막는 것 vs 가능한 것을 갈랐다.

### ✅ 출시 차단 (이게 안 되면 출시 X) — 완료

#### ✅ 통변 모순/몰개성 차단 (M) — 완료 (2026-06-05)

`/api/saju/reading/route.ts` 프롬프트에 추가 완료:

- ✅ **모순 방지 규칙**: 신강→인성추천 금지, 신약→식상권장 금지 (신강약 기반 동적 규칙 9번)
- ✅ **궁위 국소화**: 연주/월주/일주/시주 교차 금지 (규칙 10번)
- ✅ **generic 억제**: "좋은 기회", "잘 될 거야" 등 근거없는 위로 금지 (규칙 11번)
- ✅ **오행 용어 남발 금지**: 팩트시트에 없는 합충·신살 추론 금지 (규칙 12번)

**블라인드 QA**: 코드 측 준비 완료. 실제 QA는 출시 전 별도 진행.

#### ✅ 오늘의 운세 개인화 (S) — 완료 (2026-06-05)

today 타입 섹션 1번에 대운·세운 맥락 연계 강화. 일진만 보지 말고 대운 흐름 위에서 해석하도록 프롬프트 개선.

---

### ✅ 강력 권장 — 출시에 포함 완료

#### ✅ 궁합 엔진 (L) — 완료 (2026-06-05)

`src/lib/saju/compat.ts` 구현:
1. ✅ 두 `FourPillars` 일간 천간합·상생·상극
2. ✅ 일지 육합·삼합(반합)·육충
3. ✅ 오행 보완 점수 (부족 오행 × 상대 보유량)
4. ✅ 십신 역학 (정관/정재/정인 = 강한 인연, 겁재/상관 = 갈등)
5. ✅ 종합 점수 0~100 + 5단계 레벨
6. ✅ AI 해석 `/api/saju/compat` + UI `/saju/compat`

#### ✅ 무료 차트 캡 (S) — 완료 (2026-06-05)

Redis 기반 일일 3회 캡. reading + compat 공유. KST 자정 기준 TTL.

---

### ✅ Fast-follow (출시 후) — 완료 (M2로 앞당김)

#### ✅ 도메인 렌즈 분기 (M) — 완료 (2026-06-05)

`buildFactSheet(readingType)` 기반 분기:
- `today`: 핵심 신호만 (격국·용신·신강약·합충·대운 이른/늦음)
- `full`: 모든 신호
- `love/career`: route.ts 전용 focusSignals가 대체 (notableSignals 미사용)

---

## M2 — 출시 후 (트래픽 기반 + 정밀화)

**전제**: M0 advanced.ts 테스트 게이트가 있어야 이 모든 수정이 안전.  
트래픽이 가리키는 것부터, 엔진 정밀화는 병행.

### 엔진 정밀화 (전부 M0 테스트 게이트 통과 후 안전하게 가능)

| 항목 | 현재 상태 | 우선순위 |
|------|----------|---------|
| 방합(方合) — 寅卯辰·巳午未·申酉戌·亥子丑 | ✅ 완료 (2026-06-05) detectBranchBanghap() | 높음 |
| 암합·원진 세력 반영 | 탐지만 함 | 중간 |
| 12신살 사이클 풀세트 | ✅ 완료 (2026-06-05) 삼합 기반 8종 추가 (겁·재·천·지·망신·장성·반안·육해) | 중간 |
| 월운·일운 + 운–원국 작용 | 미구현 | 중간 |
| 용신 확장 — 통관법·전왕격, 종격 세분류 | ✅ 완료 (2026-06-05) 중화→통관법 용신 적용 | 중간 |
| SchoolProfile UI 노출 (학파 선택) | DEFAULT 고정 | 낮음 |
| 합충 해소 엔진 (탐합망충·충중봉합) | 미구현 | 의도적 보류 — ROI 최저 |

### 기능 확장

| 항목 | 현재 상태 | 트리거 |
|------|----------|--------|
| 특화운 독립 기능 (연애·직업·재물) | readingType만 존재 | 트래픽 확인 후 |
| 감사(audit) 페이지 | 미구현 | 신뢰 마케팅 필요 시 |
| 택일·작명 | 미구현 | 트래픽 충분 후 수익 레이어 |

### 운영 인프라

```
[ ] LLM 비용 모니터링
[ ] seolgi.json 버전 핀 (현재 파일로만 관리)
[ ] 무료 차트 수 캡 고도화
```

---

## 에이전트 오탐 기록 — "버그 1: determineGeokGuk"

에이전트가 보고한 "버그 1":
> `determineGeokGuk`이 `const dmEl = STEM_DATA[dm].element;`를 쓰고 오행 비교로 건록/양인 판정 → 오판

**실제 코드 검증 결과: 버그 없음 (false positive).**

- `dmEl` 변수는 `calcBodyStrength`(line 440)에 있음 — 완전히 다른 함수
- `determineGeokGuk`(line 474)은 `ROK_IDX`/`YANGIN_IDX` 룩업 테이블로 정확히 판정

```typescript
// ROK_IDX (건록지, BRANCHES 인덱스 기준)
갑:2(寅) 을:3(卯) 병:5(巳) 무:5(巳) 정:6(午) 기:6(午)
경:8(申) 신:9(酉) 임:11(亥) 계:0(子)  // 전부 자평진전 기준 정확

// YANGIN_IDX (양인지 = 건록+1)
갑:3(卯) 을:4(辰) 병:6(午) 무:6(午) 정:7(未) 기:7(未)
경:9(酉) 신:10(戌) 임:0(子) 계:1(丑)  // 전부 자평진전식 정확
```

에이전트 결과는 코드 재검증 후 사용할 것.

---

## 파일별 현재 상태

```
engine.ts          ✅ offset=49 수정 완료. 신뢰도 높음.
seolgi-loader.ts   ✅ 이진탐색 버그 수정 완료. 안정.
eot.ts             ✅ Spencer 공식. 안정.
constants.ts       ✅ 안정.
sipshin.ts         ✅ 안정.
server.ts          ✅ calcSajuServer → engine.ts. 안정.
advanced.ts        ✅ 사령·합화·신강·격국·용신 + 방합탐지 + 통관법 추가. 단위 테스트 87케이스 all green.
factsheet.ts       ✅ seyun KST + 12신살 풀세트 + 도메인 렌즈 분기 완료.
compat.ts          ✅ NEW — 일간·일지합충 + 오행보완 + 십신역학 + 궁합점수 엔진.
interpret.ts       ✅ 성격 프로필·십신 설명. 오행 궁합 stub (compat.ts로 대체).
pillars.ts         ✅ @deprecated 완료. 레거시.
index.ts           ✅ @deprecated 완료. 레거시.
solar.ts           ✅ @deprecated 완료. 레거시.
lunar.ts           ✅ 래퍼. 미테스트.
golden.test.ts     ✅ 43케이스 all green (2026-06-05) — 子丑月 10+入춘±30분+경도+음력+1880
advanced.test.ts   ✅ 44케이스 all green (2026-06-05)
```

---

## 순서 요약

```
이번 주    M0 — advanced.ts 테스트(★) + 골든 공백 + 레거시 정리
2~3주      M1 — 통변 QA 통과 + 오늘운세 + 궁합 → 무료 출시 + 계측 ON
출시 후    M2 — 트래픽이 가리키는 것부터 (특화운/방합/택일)
```

## 매주 점검

1. **골든 + advanced 테스트 green인가?** 아니면 멈추고 고친다.
2. **지금 깎는 게 통변/기능/신뢰인가, 수확체감 구간(엔진 정밀)인가?**
3. **트래픽이 다음 기능을 가리키나, 내가 추측하나?**

---

> 핵심 한 줄: 엔진은 거의 끝났다. 진짜 남은 일은 테스트로 잠그고(M0) → 통변·궁합으로 출시하고(M1) → 트래픽 보고 확장(M2). 엔진 정밀화는 출시를 막지 않는다.
