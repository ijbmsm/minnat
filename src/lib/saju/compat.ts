/**
 * compat.ts — 두 FourPillars 궁합 분석 엔진
 *
 * 레이어:
 * 1. 일간 천간합/충 (甲己합→土 등)
 * 2. 일지 합충 (육합·삼합·육충)
 * 3. 오행 보완 점수 (상대방이 내 부족 오행을 채우는 정도)
 * 4. 십신 역학 (상대 일간이 나의 어떤 십신인지 — 정관/정재/정인 = 긍정적 인연성)
 * 5. 종합 궁합 점수 및 코멘트
 *
 * 모든 함수 순수. 외부 IO 없음.
 */

import type { FourPillars } from './engine';
import {
  STEM_DATA, BRANCH_DATA, GENERATES, CONTROLS,
  type Element, type Stem, type Branch,
} from './constants';
import { getSipshin, getBranchSipshin } from './sipshin';
import type { Sipshin } from './constants';

// ── 천간합 쌍 ──
const STEM_COMBINE_PAIRS: readonly [Stem, Stem, Element][] = [
  ['갑', '기', '토'],
  ['을', '경', '금'],
  ['병', '신', '수'],
  ['정', '임', '목'],
  ['무', '계', '화'],
] as const;

// ── 육합 쌍 ──
const BRANCH_YUKHAP_PAIRS: readonly [Branch, Branch, Element][] = [
  ['자', '축', '토'],
  ['인', '해', '목'],
  ['묘', '술', '화'],
  ['진', '유', '금'],
  ['사', '신', '수'],
  ['오', '미', '토'],
] as const;

// ── 육충 쌍 ──
const BRANCH_CHUNG_PAIRS: readonly [Branch, Branch][] = [
  ['자', '오'], ['축', '미'], ['인', '신'],
  ['묘', '유'], ['진', '술'], ['사', '해'],
] as const;

// ── 삼합 ──
const BRANCH_SAMHAP_TRIPLES: readonly [Branch, Branch, Branch, Element][] = [
  ['신', '자', '진', '수'],
  ['인', '오', '술', '화'],
  ['사', '유', '축', '금'],
  ['해', '묘', '미', '목'],
] as const;

// ── 십신 긍정/부정 점수 ──
// 상대 일간이 나에게 어떤 십신인지에 따라 인연 강도 다름
const SIPSHIN_COMPAT_SCORE: Partial<Record<Sipshin, number>> = {
  // 강한 긍정 인연 (배우자성 / 귀인 / 지원)
  정관: 3, 편관: 2, 정재: 3, 편재: 2,
  정인: 3, 편인: 1,
  // 중립
  비견: 0, 겁재: -1,
  // 나를 소진시키는 관계
  식신: 0, 상관: -1,
};

// ── 타입 ──

export interface StemRelation {
  type: 'combine' | 'same' | 'controls' | 'generates' | 'neutral';
  element?: Element;   // combine 시 화신
  label:  string;
  score:  number;      // +/-
}

export interface BranchRelation {
  type: 'yukhap' | 'samhap' | 'chung' | 'neutral';
  element?: Element;
  label:  string;
  score:  number;
}

export interface ElementComplement {
  /** 내 부족 오행을 상대가 보충하는 정도 (0~1) */
  meScore: number;
  /** 상대 부족 오행을 내가 보충하는 정도 (0~1) */
  theirScore: number;
  /** 쌍방 보완 지수 */
  mutual: number;
  label: string;
}

export interface SipshinDynamic {
  /** 상대 일간이 나에게 어떤 십신 */
  theyToMe: Sipshin;
  /** 내 일간이 상대에게 어떤 십신 */
  meToThem: Sipshin;
  score: number;
  label: string;
}

export type CompatLevel = '천생연분' | '좋음' | '보통' | '노력 필요' | '주의';

export interface CompatAnalysis {
  /** 甲(A) × 乙(B) 구조 */
  stems: { a: Stem; b: Stem };
  dayBranches: { a: Branch; b: Branch };

  stemRelation:    StemRelation;
  dayBranchRelation: BranchRelation;
  elementComplement: ElementComplement;
  sipshinDynamic:  SipshinDynamic;

  /** 종합 점수 (0~100) */
  score: number;
  level: CompatLevel;
  /** 핵심 요약 3~5줄 */
  summary: string[];
}

// ── 내부 헬퍼 ──

function stemRelation(a: Stem, b: Stem): StemRelation {
  // 천간합
  for (const [x, y, el] of STEM_COMBINE_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return { type: 'combine', element: el, label: `${a}${b}합 → ${el}`, score: 4 };
    }
  }
  // 같은 오행
  if (STEM_DATA[a].element === STEM_DATA[b].element) {
    return { type: 'same', label: `같은 ${STEM_DATA[a].element} 오행`, score: 1 };
  }
  // A극B (A가 B를 극)
  const elA = STEM_DATA[a].element, elB = STEM_DATA[b].element;
  if (CONTROLS[elA] === elB) {
    return { type: 'controls', label: `${elA}이 ${elB}를 극 — 주도/압박 관계`, score: -1 };
  }
  if (CONTROLS[elB] === elA) {
    return { type: 'controls', label: `${elB}이 ${elA}를 극 — 압박받는 관계`, score: -1 };
  }
  // 상생
  if (GENERATES[elA] === elB || GENERATES[elB] === elA) {
    return { type: 'generates', label: `${elA}↔${elB} 상생`, score: 2 };
  }
  return { type: 'neutral', label: `${elA}×${elB} 무관`, score: 0 };
}

function dayBranchRelation(a: Branch, b: Branch): BranchRelation {
  // 육합
  for (const [x, y, el] of BRANCH_YUKHAP_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return { type: 'yukhap', element: el, label: `${a}${b} 육합 → ${el}`, score: 5 };
    }
  }
  // 삼합 (두 지지가 같은 삼합국에 있으면)
  for (const [x, y, z, el] of BRANCH_SAMHAP_TRIPLES) {
    const present = [x, y, z].filter(br => br === a || br === b);
    if (present.length === 2) {
      return { type: 'samhap', element: el, label: `${a}${b} 삼합(반합) → ${el}기운`, score: 3 };
    }
  }
  // 육충
  for (const [x, y] of BRANCH_CHUNG_PAIRS) {
    if ((a === x && b === y) || (a === y && b === x)) {
      return { type: 'chung', label: `${a}${b}충 — 일지 충돌`, score: -3 };
    }
  }
  // 같은 오행
  const elA = BRANCH_DATA[a].element, elB = BRANCH_DATA[b].element;
  if (elA === elB) {
    return { type: 'neutral', label: `같은 ${elA} 오행 일지`, score: 1 };
  }
  return { type: 'neutral', label: `${elA}×${elB} 일지`, score: 0 };
}

function elementComplement(
  myStrengthRatios:    Record<Element, number>,
  theirStrengthRatios: Record<Element, number>,
): ElementComplement {
  const els: Element[] = ['목', '화', '토', '금', '수'];

  // 내가 부족한 오행을 상대가 채우는 정도
  let meScore = 0;
  let theirScore = 0;
  for (const el of els) {
    const myLack    = Math.max(0, 0.20 - myStrengthRatios[el]);    // 20% 기준 부족분
    const theirHave = Math.max(0, theirStrengthRatios[el] - 0.15); // 상대가 넘치는 양
    meScore += myLack * theirHave;

    const theirLack = Math.max(0, 0.20 - theirStrengthRatios[el]);
    const myHave    = Math.max(0, myStrengthRatios[el] - 0.15);
    theirScore += theirLack * myHave;
  }

  // 정규화 (max 약 0.05 → 1.0 기준으로)
  const norm = (v: number) => Math.min(1, v / 0.04);
  const normMe    = norm(meScore);
  const normThem  = norm(theirScore);
  const mutual    = (normMe + normThem) / 2;

  const label =
    mutual >= 0.6 ? '오행 보완 탁월 — 서로 부족한 기운을 채워줌' :
    mutual >= 0.3 ? '오행 보완 양호 — 어느 정도 보완 작용' :
                   '오행 보완 미약 — 비슷한 성향끼리';

  return { meScore: normMe, theirScore: normThem, mutual, label };
}

function sipshinDynamic(myDayStem: Stem, theirDayStem: Stem): SipshinDynamic {
  const theyToMe = getSipshin(myDayStem, theirDayStem);
  const meToThem = getSipshin(theirDayStem, myDayStem);

  const rawScore =
    (SIPSHIN_COMPAT_SCORE[theyToMe] ?? 0) +
    (SIPSHIN_COMPAT_SCORE[meToThem] ?? 0);

  const label = (() => {
    if (rawScore >= 5) return `${theyToMe}·${meToThem} 관계 — 강한 인연 구조`;
    if (rawScore >= 2) return `${theyToMe}·${meToThem} 관계 — 좋은 인연성`;
    if (rawScore >= 0) return `${theyToMe}·${meToThem} 관계 — 보통 인연`;
    return `${theyToMe}·${meToThem} 관계 — 갈등 소지 있음`;
  })();

  return { theyToMe, meToThem, score: rawScore, label };
}

// ── 메인 함수 ──

export function compareCharts(
  fp1: FourPillars,
  fp2: FourPillars,
  fp1StrengthRatios: Record<Element, number>,
  fp2StrengthRatios: Record<Element, number>,
): CompatAnalysis {
  const stemA = fp1.day.stem, stemB = fp2.day.stem;
  const branchA = fp1.day.branch, branchB = fp2.day.branch;

  const stemRel   = stemRelation(stemA, stemB);
  const branchRel = dayBranchRelation(branchA, branchB);
  const elComp    = elementComplement(fp1StrengthRatios, fp2StrengthRatios);
  const sipshinD  = sipshinDynamic(stemA, stemB);

  // 종합 점수 산출 (가중 합산 → 0~100)
  // 일지(30) + 일간(20) + 십신역학(25) + 오행보완(25)
  const branchScore  = Math.max(0, Math.min(10, branchRel.score + 5)) / 10 * 30;
  const stemScore    = Math.max(0, Math.min(8,  stemRel.score  + 2)) / 8  * 20;
  const sipshinScore = Math.max(0, Math.min(10, sipshinD.score + 2)) / 10 * 25;
  const elemScore    = elComp.mutual * 25;

  const total = Math.round(branchScore + stemScore + sipshinScore + elemScore);

  const level: CompatLevel =
    total >= 80 ? '천생연분' :
    total >= 65 ? '좋음' :
    total >= 45 ? '보통' :
    total >= 30 ? '노력 필요' :
                 '주의';

  // 요약
  const summary: string[] = [
    `일간 관계: ${stemRel.label}`,
    `일지 관계: ${branchRel.label}`,
    `십신 역학: ${sipshinD.label}`,
    `오행 보완: ${elComp.label}`,
  ];

  if (branchRel.type === 'chung') {
    summary.push('일지충으로 배우자궁 불안정 — 연애 중 갈등·변동 경향. 서로의 성장 방향이 다를 수 있음.');
  } else if (branchRel.type === 'yukhap') {
    summary.push('일지 육합 — 가장 강한 배우자궁 합. 서로 자연스럽게 이끌리고 안정된 동반자 구조.');
  }

  // 일간합이면 특별 코멘트
  if (stemRel.type === 'combine') {
    summary.push(`일간 천간합(${stemA}${stemB}→${stemRel.element ?? ''}) — 두 사람이 만나면 새로운 에너지가 생겨남. 강한 끌림과 결속력.`);
  }

  return {
    stems: { a: stemA, b: stemB },
    dayBranches: { a: branchA, b: branchB },
    stemRelation:      stemRel,
    dayBranchRelation: branchRel,
    elementComplement: elComp,
    sipshinDynamic:    sipshinD,
    score: total,
    level,
    summary,
  };
}

// ── 궁합 LLM 프롬프트 빌더 ──

export interface CompatFactSheet {
  personA: {
    stem: Stem;
    branch: Branch;
    element: Element;
    bodyStrength: 'strong' | 'weak' | 'neutral';
    yongsin: Element | null;
  };
  personB: {
    stem: Stem;
    branch: Branch;
    element: Element;
    bodyStrength: 'strong' | 'weak' | 'neutral';
    yongsin: Element | null;
  };
  analysis: CompatAnalysis;
}

export function buildCompatPrompt(cfs: CompatFactSheet): { system: string; user: string } {
  const { personA, personB, analysis } = cfs;

  const system = `너는 한국 전통 사주명리 궁합 전문가야.
두 사람의 사주 데이터를 보고 연애·결혼 궁합을 분석해줘.
규칙:
1. 두 사람은 '첫 번째 사람(A)', '두 번째 사람(B)'으로 불러. 이름 금지.
2. 팩트 기반으로만. 없는 사실 지어내지 마.
3. "~할 것이다" 단정 금지. "~하는 경향", "~를 주의할 만하다" 식으로.
4. 반말, 친근하게. 점집 말투 금지.
5. 각 섹션 4~6문장.
6. 구체적으로 — "잘 맞는다/안 맞는다" 뭉뚱그리기 금지. 어떤 상황에서 어떻게 나타나는지.
7. 일지충이면 갈등을 과장하지 말고 "이 시기 조급함 주의" 프레임으로.`;

  const user = `[궁합 데이터]
A: ${personA.stem}일간(${personA.element}) 일지 ${personA.branch} — 신강약: ${personA.bodyStrength} / 용신: ${personA.yongsin ?? '중화'}
B: ${personB.stem}일간(${personB.element}) 일지 ${personB.branch} — 신강약: ${personB.bodyStrength} / 용신: ${personB.yongsin ?? '중화'}

[핵심 궁합 분석]
${analysis.summary.map(s => `- ${s}`).join('\n')}

종합 궁합 점수: ${analysis.score}/100 (${analysis.level})

아래 4개 섹션으로 분석해줘.
JSON 배열만 출력: [{"title":"...", "body":"..."}, ...]

1. 두 사람의 케미 — 일간·일지 관계로 보는 첫인상·끌림·기본 에너지 호환
2. 갈등 포인트와 극복법 — 마찰이 생기기 쉬운 구체적 상황, 어떻게 풀 수 있는지
3. 서로에게 미치는 영향 — A가 B를 어떻게 변화시키는지, B가 A에게 어떤 존재인지 (십신 역학 기반)
4. 함께하면 좋은 것들 — 오행 보완으로 시너지 나는 영역, 이 관계가 두 사람을 어떻게 성장시키는지`;

  return { system, user };
}
