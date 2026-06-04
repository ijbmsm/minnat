/**
 * advanced.ts — 사주 고급 레이어
 *
 * L1 : 사령(월률분야)        — 절기 경과일 → 당령신
 * L3 : 세력 정량화           — 위치가중 × 왕상휴수 × 통근 × 당령신 1.3
 * L3↔L4 : 합화·합충 탐지    — 천간합(성립여부) / 지지합(육합·삼합) / 지지충
 * L4 : 격국·용신(억부법)     — 기초 판정, heuristic 태깅
 *
 * 모든 함수 순수. 외부 IO 없음.
 */

import type { FourPillars } from './engine';
import {
  BRANCHES, STEM_DATA, BRANCH_DATA, GENERATES, CONTROLS,
  type Element, type Stem, type Branch,
} from './constants';
import { getSipshin } from './sipshin';

/* ─────────────────────────────────────────
   SchoolProfile (학파 파라미터)
───────────────────────────────────────── */

export interface SchoolProfile {
  name: string;
  strongThreshold: number;     // e.g. 0.58
  weakThreshold:   number;     // e.g. 0.42
  /** 대운 시작나이 라운딩 규약: 'round'(자평기본) | 'ceil' | 'floor' */
  daeunRounding:   'round' | 'ceil' | 'floor';
  /** 午未합 화신: '토'(자평진전) | '화'(협기변방서 등 일부) */
  yukhapOhMi:      '토' | '화';
}

export const DEFAULT_SCHOOL: SchoolProfile = {
  name:            '자평',
  strongThreshold: 0.58,
  weakThreshold:   0.42,
  daeunRounding:   'round',
  yukhapOhMi:      '토',   // 자평진전 기준
};

/* ─────────────────────────────────────────
   지장간 (月律分野 / 地藏干)
───────────────────────────────────────── */

export type JiPos = 'yeogi' | 'junggi' | 'jeongi';

export interface HiddenStem {
  stem: Stem;
  pos:  JiPos;
  days: number;
  /** 위치 가중: 여기 0.3 / 중기 0.6 / 정기(본기) 1.2 */
  w:    number;
}

// 표준 월률분야 (자평명리 기준, 합산 각 30일)
export const JIJANGGAN: Record<Branch, HiddenStem[]> = {
  자: [
    { stem: '임', pos: 'yeogi',  days: 10, w: 0.3  },
    { stem: '계', pos: 'jeongi', days: 20, w: 1.2  },
  ],
  축: [
    { stem: '계', pos: 'yeogi',  days:  9, w: 0.3  },
    { stem: '신', pos: 'junggi', days:  3, w: 0.6  },
    { stem: '기', pos: 'jeongi', days: 18, w: 1.2  },
  ],
  인: [
    { stem: '무', pos: 'yeogi',  days:  7, w: 0.3  },
    { stem: '병', pos: 'junggi', days:  7, w: 0.6  },
    { stem: '갑', pos: 'jeongi', days: 16, w: 1.2  },
  ],
  묘: [
    { stem: '갑', pos: 'yeogi',  days: 10, w: 0.3  },
    { stem: '을', pos: 'jeongi', days: 20, w: 1.2  },
  ],
  진: [
    { stem: '을', pos: 'yeogi',  days:  9, w: 0.3  },
    { stem: '계', pos: 'junggi', days:  3, w: 0.6  },
    { stem: '무', pos: 'jeongi', days: 18, w: 1.2  },
  ],
  사: [
    { stem: '무', pos: 'yeogi',  days:  7, w: 0.3  },
    { stem: '경', pos: 'junggi', days:  7, w: 0.6  },
    { stem: '병', pos: 'jeongi', days: 16, w: 1.2  },
  ],
  오: [
    { stem: '병', pos: 'yeogi',  days: 10, w: 0.3  },
    { stem: '기', pos: 'junggi', days:  9, w: 0.6  },
    { stem: '정', pos: 'jeongi', days: 11, w: 1.2  },
  ],
  미: [
    { stem: '정', pos: 'yeogi',  days:  9, w: 0.3  },
    { stem: '을', pos: 'junggi', days:  3, w: 0.6  },
    { stem: '기', pos: 'jeongi', days: 18, w: 1.2  },
  ],
  신: [
    { stem: '무', pos: 'yeogi',  days:  7, w: 0.3  },
    { stem: '임', pos: 'junggi', days:  7, w: 0.6  },
    { stem: '경', pos: 'jeongi', days: 16, w: 1.2  },
  ],
  유: [
    { stem: '경', pos: 'yeogi',  days: 10, w: 0.3  },
    { stem: '신', pos: 'jeongi', days: 20, w: 1.2  },
  ],
  술: [
    { stem: '신', pos: 'yeogi',  days:  9, w: 0.3  },
    { stem: '정', pos: 'junggi', days:  3, w: 0.6  },
    { stem: '무', pos: 'jeongi', days: 18, w: 1.2  },
  ],
  해: [
    { stem: '무', pos: 'yeogi',  days:  7, w: 0.3  },
    { stem: '갑', pos: 'junggi', days:  7, w: 0.6  },
    { stem: '임', pos: 'jeongi', days: 16, w: 1.2  },
  ],
};

/* ─────────────────────────────────────────
   L1 : 사령(당령신) 계산
───────────────────────────────────────── */

export interface SalyeongResult {
  stem:         Stem;
  element:      Element;
  pos:          JiPos;
  daysFromJie:  number;
}

/** 절기 경과일(daysFromJie)로 사령신 결정 */
export function calcSalyeong(branch: Branch, daysFromJie: number): SalyeongResult {
  const hidden = JIJANGGAN[branch];
  let cumulative = 0;
  for (const h of hidden) {
    cumulative += h.days;
    if (daysFromJie <= cumulative) {
      return { stem: h.stem, element: STEM_DATA[h.stem].element, pos: h.pos, daysFromJie };
    }
  }
  const last = hidden[hidden.length - 1];
  return { stem: last.stem, element: STEM_DATA[last.stem].element, pos: 'jeongi', daysFromJie };
}

/* ─────────────────────────────────────────
   L3 : 왕상휴수사(旺相休囚死) 계수
───────────────────────────────────────── */

/**
 * 월령 오행(M)에 대한 대상 오행(e)의 季節 계수.
 * 旺 1.4 / 相 1.2 / 休 1.0 / 囚 0.8 / 死 0.6
 */
export function getSeasonCoeff(e: Element, M: Element): number {
  if (e === M)               return 1.4;  // 旺: e = 월령
  if (GENERATES[M] === e)    return 1.2;  // 相: 월령이 e를 生
  if (GENERATES[e] === M)    return 1.0;  // 休: e가 월령을 生
  if (CONTROLS[e]  === M)    return 0.8;  // 囚: e가 월령을 克
  if (CONTROLS[M]  === e)    return 0.6;  // 死: 월령이 e를 克
  // 5오행 상생/상극은 완전 그래프 — 여기 도달하면 입력 버그
  throw new Error(`getSeasonCoeff: 오행 관계 미분류 (e=${e}, M=${M}) — 도달 불가`);
}

/* ─────────────────────────────────────────
   L3 : 통근(通根) — 천간의 지지 뿌리
───────────────────────────────────────── */

export interface RootInfo {
  branch:  Branch;
  pos:     JiPos;
  /** 정기근 1.5 / 중기근 1.2 / 여기근 1.1 */
  bonus:   number;
}

/** 특정 천간이 네 지지(branches)에 통근하는지 검사 */
export function findRoots(stem: Stem, branches: Branch[]): RootInfo[] {
  const stemEl = STEM_DATA[stem].element;
  const roots: RootInfo[] = [];
  for (const branch of branches) {
    for (const hs of JIJANGGAN[branch]) {
      if (STEM_DATA[hs.stem].element === stemEl) {
        roots.push({
          branch,
          pos: hs.pos,
          bonus: hs.pos === 'jeongi' ? 1.5 : hs.pos === 'junggi' ? 1.2 : 1.1,
        });
      }
    }
  }
  return roots;
}

function bestRootBonus(stem: Stem, branches: Branch[]): number {
  const roots = findRoots(stem, branches);
  return roots.length > 0 ? Math.max(...roots.map(r => r.bonus)) : 1.0;
}

/* ─────────────────────────────────────────
   L3↔L4 : 합화·합충 탐지
───────────────────────────────────────── */

// 천간합 (甲己→土 / 乙庚→金 / 丙辛→水 / 丁壬→木 / 戊癸→火)
const STEM_COMBINE: readonly [Stem, Stem, Element][] = [
  ['갑', '기', '토'],
  ['을', '경', '금'],
  ['병', '신', '수'],
  ['정', '임', '목'],
  ['무', '계', '화'],
] as const;

// 육합 화신 — 자평진전 기준 (학파별 이견 있음)
// 子丑→土 / 寅亥→木 / 卯戌→火 / 辰酉→金 / 巳申→水
// 午未→土 (자평진전·명리정종) ← 午未합 화신 논쟁: 협기변방서 등 일부는 火로 보지만 자평진전은 土
// DEFAULT_SCHOOL.yukhapOhMi 로 학파별 전환 가능
const BRANCH_YUKHAP: readonly [Branch, Branch, Element][] = [
  ['자', '축', '토'],
  ['인', '해', '목'],
  ['묘', '술', '화'],
  ['진', '유', '금'],
  ['사', '신', '수'],
  ['오', '미', '토'],  // 자평진전 기준 土 (협기변방서 등 火 주장도 있음)
] as const;

// 삼합 (申子辰→水 / 寅午戌→火 / 巳酉丑→金 / 亥卯未→木)
const BRANCH_SAMHAP: readonly [Branch, Branch, Branch, Element][] = [
  ['신', '자', '진', '수'],
  ['인', '오', '술', '화'],
  ['사', '유', '축', '금'],
  ['해', '묘', '미', '목'],
] as const;

// 육충 (子午 / 丑未 / 寅申 / 卯酉 / 辰戌 / 巳亥)
const BRANCH_CHUNG: readonly [Branch, Branch][] = [
  ['자', '오'], ['축', '미'], ['인', '신'],
  ['묘', '유'], ['진', '술'], ['사', '해'],
] as const;

export interface StemCombineResult {
  a: Stem; b: Stem;
  /** 화신(化神) 오행 */
  transformed: Element;
  /** 합화 성립 여부 (化神이 월령에서 旺·相이면 성립) */
  formed: boolean;
  /** 사주 내 위치 인덱스 [연0, 월1, 일2, 시3] */
  positions: [number, number];
  /** 인접 강도 — dist=1 강합 / dist=2 약합 / dist=3 원격(불성립 가능성 높음) */
  strength: '강' | '약' | '원격';
}

export interface BranchHapResult {
  type:     '육합' | '삼합' | '반합';
  branches: Branch[];
  element:  Element;
}

export interface HapChungResult {
  stemCombines: StemCombineResult[];
  branchHaps:   BranchHapResult[];
  branchChungs: [Branch, Branch][];
}

function detectStemCombines(stems: Stem[], monthEl: Element): StemCombineResult[] {
  const result: StemCombineResult[] = [];

  // 전수 탐색: indexOf 대신 모든 위치 쌍을 확인해 중복 천간도 정확히 처리
  for (let i = 0; i < stems.length; i++) {
    for (let j = i + 1; j < stems.length; j++) {
      const sa = stems[i], sb = stems[j];
      const match = STEM_COMBINE.find(
        ([a, b]) => (sa === a && sb === b) || (sa === b && sb === a)
      );
      if (!match) continue;
      const [a, b, transformedEl] = match;
      const dist = j - i;
      const strength: StemCombineResult['strength'] =
        dist === 1 ? '강' : dist === 2 ? '약' : '원격';
      // 쟁합(爭合)/투합(妬合): 같은 천간이 두 곳 이상 있으면 합력 약화 (탐지만, formed에 영향 없음)
      const formed = dist <= 2 && getSeasonCoeff(transformedEl, monthEl) >= 1.2;
      result.push({
        a: sa === a ? a : b,
        b: sa === a ? b : a,
        transformed: transformedEl,
        formed,
        positions: [i, j],
        strength,
      });
    }
  }
  return result;
}

function detectBranchHaps(branches: Branch[]): BranchHapResult[] {
  const result: BranchHapResult[] = [];
  const brSet = new Set(branches);

  for (const [a, b, el] of BRANCH_YUKHAP) {
    if (brSet.has(a) && brSet.has(b))
      result.push({ type: '육합', branches: [a, b], element: el });
  }
  for (const [a, b, c, el] of BRANCH_SAMHAP) {
    const present = [a, b, c].filter(x => brSet.has(x));
    if (present.length === 3)
      result.push({ type: '삼합', branches: present, element: el });
    else if (present.length === 2)
      result.push({ type: '반합', branches: present, element: el });
  }
  return result;
}

function detectBranchChungs(branches: Branch[]): [Branch, Branch][] {
  const result: [Branch, Branch][] = [];
  for (const [a, b] of BRANCH_CHUNG) {
    if (branches.includes(a) && branches.includes(b))
      result.push([a, b]);
  }
  return result;
}

/* ─────────────────────────────────────────
   L3 : 오행 세력 정량화
   S(e) = Σ [ w_pos × season(e) × root_bonus × salyeong_bonus ]
───────────────────────────────────────── */

export interface ElementStrengths {
  scores:   Record<Element, number>;
  total:    number;
  ratios:   Record<Element, number>;
  salyeong: SalyeongResult;
}

export function calcElementStrengths(
  fp:           FourPillars,
  daysFromJie:  number,
  school:       SchoolProfile = DEFAULT_SCHOOL,
  applyHapHwa:  boolean = false,
): ElementStrengths {
  const monthEl = BRANCH_DATA[fp.month.branch].element;
  const scores: Record<Element, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const salyeong = calcSalyeong(fp.month.branch, daysFromJie);

  const pillars = [fp.year, fp.month, fp.day, ...(fp.hour ? [fp.hour] : [])];
  const stems   = pillars.map(p => p.stem) as Stem[];
  const branches = pillars.map(p => p.branch) as Branch[];

  // 합화 적용 시: 성립한 합에 참여하는 천간/지지 추적
  const hapStemOverride  = new Map<Stem, Element>(); // 천간합화 성립 시 오행 교체
  const hapBranchBoost   = new Map<Branch, Element>(); // 지지합 성립 시 강화 오행

  if (applyHapHwa) {
    // 천간합화 — formed=true인 것만 적용
    for (const [a, b, transformedEl] of STEM_COMBINE) {
      const ai = stems.indexOf(a), bi = stems.indexOf(b);
      if (ai === -1 || bi === -1 || Math.abs(ai - bi) > 2) continue;
      if (getSeasonCoeff(transformedEl, monthEl) >= 1.2) {
        hapStemOverride.set(a, transformedEl);
        hapStemOverride.set(b, transformedEl);
      }
    }

    // 지지합 — 육합/삼합(완전삼합만) 적용
    const brSet = new Set(branches);
    for (const [a, b, el] of BRANCH_YUKHAP) {
      if (brSet.has(a) && brSet.has(b)) {
        hapBranchBoost.set(a, el);
        hapBranchBoost.set(b, el);
      }
    }
    for (const [a, b, c, el] of BRANCH_SAMHAP) {
      if (brSet.has(a) && brSet.has(b) && brSet.has(c)) {
        hapBranchBoost.set(a, el);
        hapBranchBoost.set(b, el);
        hapBranchBoost.set(c, el);
      }
    }
  }

  // 1) 천간 기여: w=1.0 × 왕상휴수 × 통근 × 사령
  for (const p of pillars) {
    const el = hapStemOverride.get(p.stem) ?? STEM_DATA[p.stem].element;
    const season   = getSeasonCoeff(el, monthEl);
    const root     = bestRootBonus(p.stem, branches);
    const salyeongB = salyeong.element === el ? 1.3 : 1.0;
    scores[el] += 1.0 * season * root * salyeongB;
  }

  // 2) 지지 지장간 기여: 각 hidden stem 가중 × 왕상휴수 × 사령
  for (const branch of branches) {
    // 합화 지지: 합화 오행으로 추가 점수 부여 (지장간 외 +0.5)
    if (applyHapHwa) {
      const boostEl = hapBranchBoost.get(branch);
      if (boostEl) {
        const season = getSeasonCoeff(boostEl, monthEl);
        const salyeongB = salyeong.element === boostEl ? 1.3 : 1.0;
        scores[boostEl] += 0.5 * season * salyeongB;
      }
    }
    for (const hs of JIJANGGAN[branch]) {
      const el = STEM_DATA[hs.stem].element;
      const season   = getSeasonCoeff(el, monthEl);
      const salyeongB = salyeong.element === el ? 1.3 : 1.0;
      scores[el] += hs.w * season * salyeongB;
    }
  }

  const total = (Object.values(scores) as number[]).reduce((s, v) => s + v, 0);
  const ratios = {} as Record<Element, number>;
  for (const el of ['목','화','토','금','수'] as Element[]) {
    ratios[el] = total > 0 ? scores[el] / total : 0;
  }

  return { scores, total, ratios, salyeong };
}

/* ─────────────────────────────────────────
   L3 : 신강/신약 (정량화 기반)
───────────────────────────────────────── */

export type BodyStrength = 'strong' | 'neutral' | 'weak';

export function calcBodyStrength(
  fp:        FourPillars,
  strengths: ElementStrengths,
  school:    SchoolProfile = DEFAULT_SCHOOL,
): BodyStrength {
  const dmEl = STEM_DATA[fp.day.stem].element;
  // 일간을 生하는 오행 = 인성(印星) 오행
  const parentEl = (Object.entries(GENERATES) as [Element, Element][])
    .find(([, v]) => v === dmEl)?.[0];

  const selfScore   = strengths.scores[dmEl]       ?? 0;
  const parentScore = parentEl ? (strengths.scores[parentEl] ?? 0) : 0;
  const ratio = (selfScore + parentScore) / strengths.total;

  if (ratio > school.strongThreshold) return 'strong';
  if (ratio < school.weakThreshold)   return 'weak';
  return 'neutral';
}

/* ─────────────────────────────────────────
   L4 : 격국(格局) 판정
───────────────────────────────────────── */

export interface GeokGukResult {
  name:       string;
  sipshin:    string | null;
  projected:  boolean;               // 투간 여부
  confidence: 'deterministic' | 'heuristic';
}

// 일간 → 록지(建祿) / 양인지(羊刃) 지지 인덱스 (子=0..亥=11)
// 양인 = 록지에서 지지 순행 +1 (단 음간은 학파별 논쟁 있음 — 여기서는 자평진전식 적용)
const ROK_IDX: Partial<Record<Stem, number>> = {
  갑:2, 을:3, 병:5, 무:5, 정:6, 기:6, 경:8, 신:9, 임:11, 계:0,
};
const YANGIN_IDX: Partial<Record<Stem, number>> = {
  갑:3, 을:4, 병:6, 무:6, 정:7, 기:7, 경:9, 신:10, 임:0, 계:1,
};

export function determineGeokGuk(fp: FourPillars, daysFromJie: number): GeokGukResult {
  const dm      = fp.day.stem;
  const salyeong = calcSalyeong(fp.month.branch, daysFromJie);
  const stems   = [fp.year.stem, fp.month.stem, fp.day.stem, ...(fp.hour ? [fp.hour.stem] : [])];
  const projected = stems.includes(salyeong.stem);
  const sipshin = getSipshin(dm, salyeong.stem);
  const mbIdx   = BRANCHES.indexOf(fp.month.branch);

  // 건록·양인은 오행 비교가 아닌 정확한 지지 룩업으로 판정
  if (mbIdx === ROK_IDX[dm]) {
    return { name: '건록격', sipshin, projected, confidence: 'deterministic' };
  }
  if (mbIdx === YANGIN_IDX[dm]) {
    return { name: '양인격', sipshin, projected, confidence: 'deterministic' };
  }

  return {
    name:       sipshin ? `${sipshin}격` : '잡기격',
    sipshin,
    projected,
    confidence: projected ? 'deterministic' : 'heuristic',
  };
}

/* ─────────────────────────────────────────
   L4 : 용신(用神) — 억부법
───────────────────────────────────────── */

export interface YongSinResult {
  yongsin:  Element | null;  // null = 중화(억부 부적용)
  gisin:    Element | null;  // null = 중화
  label:    string;
  reason:   string;
  /** 용신 오행이 원국에 실제로 존재하는지 — false면 운에서 보충 필요 */
  present:  boolean;
  /** 종격·중화·부재 등 부가 메모 */
  note?:    string;
  confidence: 'heuristic';
}

/** 종격 판단: 어느 오행이 70% 이상 지배하면 억부법 부적용 */
function isJonggyeok(strengths: ElementStrengths): boolean {
  return (Object.values(strengths.ratios) as number[]).some(r => r >= 0.70);
}

function jonggyeokYongsin(strengths: ElementStrengths): YongSinResult {
  const dominant = (Object.entries(strengths.ratios) as [Element, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
  return {
    yongsin: dominant,
    gisin:   CONTROLS[dominant],
    label:   '종격(지배 오행)',
    reason:  `${dominant} 세력 ${Math.round(strengths.ratios[dominant] * 100)}% 압도 → 억부 부적용, 종격 추정`,
    present: true,
    note:    '종격(종왕/종강/종아/종재/종살) 추정 — 지배 오행을 따라가는 용신 적용, heuristic',
    confidence: 'heuristic',
  };
}

export function determineYongSin(
  fp:           FourPillars,
  bodyStrength: BodyStrength,
  strengths:    ElementStrengths,
): YongSinResult {
  // 0) 종격 가드 — 억부 자체가 틀리는 케이스 선처리
  if (isJonggyeok(strengths)) return jonggyeokYongsin(strengths);

  // 1) 중화 — 신약으로 흘리지 말고 별도 처리
  if (bodyStrength === 'neutral') {
    return {
      yongsin:    null,
      gisin:      null,
      label:      '중화',
      reason:     '중화 사주 — 억부 기준 모호, 통관용신·병약법 권장',
      present:    false,
      note:       '원국이 중화에 가까워 억부법 적용 어려움. 부족 오행 보충(통관) 또는 병약법 권장',
      confidence: 'heuristic',
    };
  }

  const dmEl = STEM_DATA[fp.day.stem].element;
  const els = ['목','화','토','금','수'] as Element[];
  const parentEl   = els.find(e => GENERATES[e] === dmEl)!;  // 인성
  const siksangEl  = GENERATES[dmEl];                         // 식상
  const jaeEl      = CONTROLS[dmEl];                          // 재성
  const gwanEl     = els.find(e => CONTROLS[e] === dmEl)!;    // 관살

  let best: Element;
  let bestLabel: string;

  if (bodyStrength === 'strong') {
    // 2a) 신강: 식상·재·관 중 균형 기여 최대 오행 (= 가장 부족한 것)
    const candidates: [Element, string][] = [
      [siksangEl, '식상(설기)'],
      [jaeEl,     '재성'],
      [gwanEl,    '관살'],
    ];
    [best, bestLabel] = candidates.reduce((a, b) =>
      strengths.scores[a[0]] <= strengths.scores[b[0]] ? a : b
    );
  } else {
    // 2b) 신약: 인성·비겁 중 가장 부족한 것
    const candidates: [Element, string][] = [
      [parentEl, '인성(부조)'],
      [dmEl,     '비겁(부조)'],
    ];
    [best, bestLabel] = candidates.reduce((a, b) =>
      strengths.scores[a[0]] <= strengths.scores[b[0]] ? a : b
    );
  }

  const present = strengths.scores[best] > 0;
  const reason  = bodyStrength === 'strong'
    ? '신강 → 설기·극제로 균형'
    : '신약 → 인성·비겁으로 부조';

  return {
    yongsin:    best,
    gisin:      CONTROLS[best],
    label:      bestLabel,
    reason,
    present,
    note:       present ? undefined : '원국에 용신 오행 부재 — 대운·세운에서 보충 필요',
    confidence: 'heuristic',
  };
}

/* ─────────────────────────────────────────
   통합 분석
───────────────────────────────────────── */

export interface AdvancedAnalysis {
  strengths:    ElementStrengths;
  bodyStrength: BodyStrength;
  hapChung:     HapChungResult;
  geokGuk:      GeokGukResult;
  yongSin:      YongSinResult;
}

export function analyzeAdvanced(
  fp:           FourPillars,
  daysFromJie:  number = 15,
  school:       SchoolProfile = DEFAULT_SCHOOL,
  applyHapHwa:  boolean = false,
): AdvancedAnalysis {
  const strengths    = calcElementStrengths(fp, daysFromJie, school, applyHapHwa);
  const bodyStrength = calcBodyStrength(fp, strengths, school);

  const stems    = [fp.year.stem, fp.month.stem, fp.day.stem, ...(fp.hour ? [fp.hour.stem] : [])] as Stem[];
  const branches = [fp.year.branch, fp.month.branch, fp.day.branch, ...(fp.hour ? [fp.hour.branch] : [])] as Branch[];
  const monthEl  = BRANCH_DATA[fp.month.branch].element;

  const hapChung: HapChungResult = {
    stemCombines: detectStemCombines(stems, monthEl),
    branchHaps:   detectBranchHaps(branches),
    branchChungs: detectBranchChungs(branches),
  };

  const geokGuk = determineGeokGuk(fp, daysFromJie);
  const yongSin = determineYongSin(fp, bodyStrength, strengths);

  return { strengths, bodyStrength, hapChung, geokGuk, yongSin };
}
