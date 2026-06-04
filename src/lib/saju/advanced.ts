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
  STEM_DATA, BRANCH_DATA, GENERATES, CONTROLS,
  type Element, type Stem, type Branch,
} from './constants';
import { getSipshin } from './sipshin';

/* ─────────────────────────────────────────
   SchoolProfile (학파 파라미터)
───────────────────────────────────────── */

export interface SchoolProfile {
  name: string;
  strongThreshold: number;   // e.g. 0.58
  weakThreshold:   number;   // e.g. 0.42
}

export const DEFAULT_SCHOOL: SchoolProfile = {
  name: '자평',
  strongThreshold: 0.58,
  weakThreshold:   0.42,
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
  return 1.0;
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

// 육합 (子丑→土 / 寅亥→木 / 卯戌→火 / 辰酉→金 / 巳申→水 / 午未→火)
const BRANCH_YUKHAP: readonly [Branch, Branch, Element][] = [
  ['자', '축', '토'],
  ['인', '해', '목'],
  ['묘', '술', '화'],
  ['진', '유', '금'],
  ['사', '신', '수'],
  ['오', '미', '화'],
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
  for (const [a, b, transformedEl] of STEM_COMBINE) {
    const ai = stems.indexOf(a), bi = stems.indexOf(b);
    if (ai === -1 || bi === -1) continue;
    // 인접(거리 ≤ 2) 체크
    if (Math.abs(ai - bi) > 2) continue;
    const formed = getSeasonCoeff(transformedEl, monthEl) >= 1.2;
    result.push({ a, b, transformed: transformedEl, formed });
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
): ElementStrengths {
  const monthEl = BRANCH_DATA[fp.month.branch].element;
  const scores: Record<Element, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const salyeong = calcSalyeong(fp.month.branch, daysFromJie);

  const pillars = [fp.year, fp.month, fp.day, ...(fp.hour ? [fp.hour] : [])];
  const branches = pillars.map(p => p.branch) as Branch[];

  // 1) 천간 기여: w=1.0 × 왕상휴수 × 통근 × 사령
  for (const p of pillars) {
    const el = STEM_DATA[p.stem].element;
    const season   = getSeasonCoeff(el, monthEl);
    const root     = bestRootBonus(p.stem, branches);
    const salyeongB = salyeong.element === el ? 1.3 : 1.0;
    scores[el] += 1.0 * season * root * salyeongB;
  }

  // 2) 지지 지장간 기여: 각 hidden stem 가중 × 왕상휴수 × 사령
  for (const branch of branches) {
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

export function determineGeokGuk(fp: FourPillars, daysFromJie: number): GeokGukResult {
  const dm      = fp.day.stem;
  const salyeong = calcSalyeong(fp.month.branch, daysFromJie);
  const stems   = [fp.year.stem, fp.month.stem, fp.day.stem, ...(fp.hour ? [fp.hour.stem] : [])];
  const projected = stems.includes(salyeong.stem);
  const sipshin = getSipshin(dm, salyeong.stem);

  if (sipshin === '비견' || sipshin === '겁재') {
    const dmEl = STEM_DATA[dm].element;
    const brEl = BRANCH_DATA[fp.month.branch].element;
    return {
      name:       dmEl === brEl ? '건록격' : '양인격',
      sipshin,
      projected,
      confidence: 'deterministic',
    };
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
  yongsin:  Element;      // 용신 오행
  gisin:    Element;      // 기신 오행 (용신을 克하는 것)
  label:    string;       // 용신 역할 이름
  reason:   string;
  confidence: 'heuristic';
}

export function determineYongSin(
  fp:           FourPillars,
  bodyStrength: BodyStrength,
  strengths:    ElementStrengths,
): YongSinResult {
  const dmEl = STEM_DATA[fp.day.stem].element;

  const els = ['목','화','토','금','수'] as Element[];
  const parentEl = els.find(e => GENERATES[e] === dmEl)!;   // 인성
  const siksangEl = GENERATES[dmEl];                         // 식상
  const jaeEl = CONTROLS[dmEl];                             // 재성
  const gwanEl = els.find(e => CONTROLS[e] === dmEl)!;      // 관살

  let yongsin: Element;
  let label: string;

  if (bodyStrength === 'strong') {
    // 설기(식상) / 재 / 관 중 가장 약한 것 = 용신
    const candidates: [Element, string][] = [
      [siksangEl, '식상(설기)'],
      [jaeEl,     '재성'],
      [gwanEl,    '관살'],
    ];
    const [best, bestLabel] = candidates.reduce((a, b) =>
      strengths.scores[a[0]] <= strengths.scores[b[0]] ? a : b
    );
    yongsin = best; label = bestLabel;
  } else {
    // 인성 / 비겁 중 가장 약한 것 = 용신
    const candidates: [Element, string][] = [
      [parentEl, '인성(부조)'],
      [dmEl,     '비겁(부조)'],
    ];
    const [best, bestLabel] = candidates.reduce((a, b) =>
      strengths.scores[a[0]] <= strengths.scores[b[0]] ? a : b
    );
    yongsin = best; label = bestLabel;
  }

  const gisin = CONTROLS[yongsin]; // 용신을 克하는 것
  const reason = bodyStrength === 'strong' ? '신강 → 설기·극제로 균형' : '신약 → 인성·비겁으로 부조';

  return { yongsin, gisin, label, reason, confidence: 'heuristic' };
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
  fp:          FourPillars,
  daysFromJie: number = 15,
  school:      SchoolProfile = DEFAULT_SCHOOL,
): AdvancedAnalysis {
  const strengths    = calcElementStrengths(fp, daysFromJie, school);
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
