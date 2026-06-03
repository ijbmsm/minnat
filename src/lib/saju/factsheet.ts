/**
 * SajuFactSheet — 룰 엔진 결과를 LLM 입력용 구조화 데이터로 변환.
 *
 * 이 파일은 순수 함수: 외부 IO 없음, 타입스크립트만.
 * LLM이 generic 출력을 뱉지 않도록 notableSignals에 차트 고유 팩트를 3-8개 뽑음.
 */

import type { FourPillars, Pillar } from './engine';
import {
  STEMS, BRANCHES, ELEMENTS, STEM_DATA, BRANCH_DATA,
  type Element, type Stem, type Branch, type Sipshin,
} from './constants';
import { getSipshin, getBranchSipshin } from './sipshin';
import { DAY_MASTER_PROFILE, SIPSHIN_DESC } from './interpret';

// ── 세운(년운) 계산 헬퍼 ──
function makeSeyunPillar(year: number): Pillar {
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const gz = mod(year - 4, 60);
  return { stem: STEMS[gz % 10], branch: BRANCHES[gz % 12], gz };
}

// ── 버전 (캐시 키 일부) ──
const FACTSHEET_VERSION = '1.0.0';

// ── 타입 ──

export interface PillarFact {
  palace:        '년' | '월' | '일' | '시';
  stem:          Stem;
  branch:        Branch;
  stemElement:   Element;
  branchElement: Element;
  /** null = 일간 본인 (일주 천간) */
  sipshinStem:   Sipshin | null;
  sipshinBranch: Sipshin;
}

export interface SajuFactSheet {
  meta: {
    version:     string;
    cacheKey:    string;
    generatedAt: string;
  };
  dayMaster: {
    stem:     Stem;
    element:  Element;
    yang:     boolean;
    hanja:    string;
    image:    string;
    keywords: string[];
    core:     string;
    strength: string;
    weakness: string;
    vibe:     string;
  };
  pillars:      PillarFact[];
  elements:     Record<Element, number>;
  elementTotal: number;
  /** 십신별 등장 횟수 (일간 천간 본인 제외) */
  tenGodCounts: Partial<Record<Sipshin, number>>;
  /** 신강/신약/중화 (간이 판단) */
  bodyStrength: 'strong' | 'weak' | 'neutral';
  /** 대운 시작 나이 */
  daeunStartAge: number;
  /** 현재 + 내년 세운 (년운) */
  seyun: Array<{
    year:          number;
    stem:          Stem;
    branch:        Branch;
    stemElement:   Element;
    branchElement: Element;
    sipshinStem:   Sipshin;
    sipshinBranch: Sipshin;
  }>;
  /** 사용자 이름 (있으면 AI 호칭 개인화) */
  name?: string;
  /** 현재 고민 (있으면 AI 맥락 주입) */
  concern?: string;
  /** 이 차트에서 가장 두드러진 팩트 3-8개 — LLM anchoring용 */
  notableSignals: string[];
  /** LLM이 단정 해석을 피해야 하는 주의사항 */
  cautions: string[];
}

// ── 캐시 키 ──

export function makeCacheKey(
  fp: FourPillars,
  tier: 'free' | 'paid',
  type: string,
): string {
  const h = fp.hour ? String(fp.hour.gz) : 'x';
  return `saju:r:${FACTSHEET_VERSION}:${tier}:${type}:${fp.year.gz}-${fp.month.gz}-${fp.day.gz}-${h}`;
}

// ── 메인 함수 ──

export function buildFactSheet(
  fp: FourPillars,
  tier: 'free' | 'paid' = 'free',
  readingType: 'full' | 'career' | 'love' = 'full',
  opts: { name?: string; concern?: string } = {},
): SajuFactSheet {
  const dm       = fp.day.stem;
  const dmData   = STEM_DATA[dm];
  const dmProfile = DAY_MASTER_PROFILE[dm];

  // ── 주 배열 ──
  const rawPillars: Array<[typeof fp.year, '년' | '월' | '일' | '시']> = [
    [fp.year,  '년'],
    [fp.month, '월'],
    [fp.day,   '일'],
    ...(fp.hour ? [[fp.hour, '시'] as [typeof fp.hour, '시']] : []),
  ];

  const pillars: PillarFact[] = rawPillars.map(([p, palace]) => ({
    palace,
    stem:          p.stem,
    branch:        p.branch,
    stemElement:   STEM_DATA[p.stem].element,
    branchElement: BRANCH_DATA[p.branch].element,
    sipshinStem:   palace === '일' ? null : getSipshin(dm, p.stem),
    sipshinBranch: getBranchSipshin(dm, p.branch),
  }));

  // ── 오행 카운트 ──
  const elements: Record<Element, number> = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  for (const p of pillars) {
    elements[p.stemElement]++;
    elements[p.branchElement]++;
  }
  const elementTotal = pillars.length * 2;

  // ── 십신 카운트 ──
  const tenGodCounts: Partial<Record<Sipshin, number>> = {};
  for (const p of pillars) {
    if (p.sipshinStem) {
      tenGodCounts[p.sipshinStem] = (tenGodCounts[p.sipshinStem] ?? 0) + 1;
    }
    tenGodCounts[p.sipshinBranch] = (tenGodCounts[p.sipshinBranch] ?? 0) + 1;
  }

  // ── 신강/신약 판단 (간이) ──
  const selfCount = (tenGodCounts['비견'] ?? 0) + (tenGodCounts['겁재'] ?? 0);
  const inCount   = (tenGodCounts['편인'] ?? 0) + (tenGodCounts['정인'] ?? 0);
  const support   = selfCount + inCount;
  const bodyStrength: 'strong' | 'weak' | 'neutral' =
    support >= Math.ceil(elementTotal * 0.5)  ? 'strong'
    : support <= Math.floor(elementTotal * 0.25) ? 'weak'
    : 'neutral';

  // ── 세운 (올해 + 내년) ──
  const currentYear = new Date().getFullYear();
  const seyun = [currentYear, currentYear + 1].map(y => {
    const p = makeSeyunPillar(y);
    return {
      year:          y,
      stem:          p.stem,
      branch:        p.branch,
      stemElement:   STEM_DATA[p.stem].element,
      branchElement: BRANCH_DATA[p.branch].element,
      sipshinStem:   getSipshin(dm, p.stem),
      sipshinBranch: getBranchSipshin(dm, p.branch),
    };
  });

  // ── notableSignals ──
  const notableSignals: string[] = [];

  // 오행 과다·부재
  for (const el of ELEMENTS) {
    const ratio = elements[el] / elementTotal;
    if (ratio >= 0.375) {
      notableSignals.push(`오행 ${el} 과다 — ${elements[el]}/${elementTotal} (${Math.round(ratio*100)}%)`);
    } else if (elements[el] === 0) {
      notableSignals.push(`오행 ${el} 완전 부재`);
    }
  }

  // 십신 집중
  for (const [tg, cnt] of Object.entries(tenGodCounts) as [Sipshin, number][]) {
    if (cnt >= 3) {
      notableSignals.push(`${tg} ${cnt}개 집중 — ${SIPSHIN_DESC[tg]?.short ?? ''} 성향 강함`);
    } else if (cnt >= 2) {
      notableSignals.push(`${tg} 2개`);
    }
  }

  // 신강/신약 요약
  const strengthLabel = { strong: '신강(일간 강)', weak: '신약(일간 약)', neutral: '중화' }[bodyStrength];
  notableSignals.push(strengthLabel);

  // 대운 이른/늦음
  const daeunAge = fp.daeun[0]?.startAge ?? 0;
  if (daeunAge <= 3) notableSignals.push(`대운 ${daeunAge}세 시작 — 매우 이른 대운 진입`);
  else if (daeunAge >= 8) notableSignals.push(`대운 ${daeunAge}세 시작 — 늦은 대운 진입`);

  // 시주 미상
  if (!fp.hour) notableSignals.push('시주 미입력 — 시간 관련 궁(직업·노년) 해석 불가');

  // ── 주의사항 ──
  const cautions: string[] = [];
  if (!fp.hour)               cautions.push('시주 없음: 시주 궁(직업·노년 운) 해석 제외');
  if (fp.trace.boundaryCaution) cautions.push('절기 경계 출생: 월주 불확실, 단정 금지');

  return {
    meta: {
      version:     FACTSHEET_VERSION,
      cacheKey:    makeCacheKey(fp, tier, readingType),
      generatedAt: new Date().toISOString(),
    },
    dayMaster: {
      stem:     dm,
      element:  dmData.element,
      yang:     dmData.yang,
      hanja:    dmData.hanja,
      image:    dmData.image,
      keywords: dmProfile.keyword,
      core:     dmProfile.core,
      strength: dmProfile.strength,
      weakness: dmProfile.weakness,
      vibe:     dmProfile.vibe,
    },
    pillars,
    elements,
    elementTotal,
    tenGodCounts,
    bodyStrength,
    daeunStartAge: daeunAge,
    seyun,
    name:    opts.name    || undefined,
    concern: opts.concern || undefined,
    notableSignals,
    cautions,
  };
}
