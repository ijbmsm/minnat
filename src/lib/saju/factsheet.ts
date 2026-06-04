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
import { analyzeAdvanced, type AdvancedAnalysis } from './advanced';

// ── 세운(년운) 계산 헬퍼 ──
function makeSeyunPillar(year: number): Pillar {
  const mod = (n: number, m: number) => ((n % m) + m) % m;
  const gz = mod(year - 4, 60);
  return { stem: STEMS[gz % 10], branch: BRANCHES[gz % 12], gz };
}

// ── 버전 (캐시 키 일부) ──
const FACTSHEET_VERSION = '2.0.0';

// ── 신살 테이블 ──
const YEOKMA_MAP: Partial<Record<Branch, Branch>> = {
  인:'신', 오:'신', 술:'신', 신:'인', 자:'인', 진:'인',
  사:'해', 유:'해', 축:'해', 해:'사', 묘:'사', 미:'사',
};
const DOHWA_MAP: Partial<Record<Branch, Branch>> = {
  인:'묘', 오:'묘', 술:'묘', 사:'오', 유:'오', 축:'오',
  신:'유', 자:'유', 진:'유', 해:'자', 묘:'자', 미:'자',
};
const YANGIN_MAP: Partial<Record<Stem, Branch>> = {
  갑:'묘', 병:'오', 무:'오', 경:'유', 임:'자',
};
const HWAGAE_MAP: Partial<Record<Branch, Branch>> = {
  인:'술', 오:'술', 술:'술', 사:'축', 유:'축', 축:'축',
  신:'진', 자:'진', 진:'진', 해:'미', 묘:'미', 미:'미',
};
const GUI_MAP: Partial<Record<Stem, Branch[]>> = {
  갑:['축','미'], 무:['축','미'], 경:['축','미'],
  을:['자','신'], 기:['자','신'],
  병:['해','유'], 정:['해','유'],
  신:['인','오'],
  임:['묘','사'], 계:['묘','사'],
};

function computeSinsal(fp: FourPillars): SinsalResult[] {
  const result: SinsalResult[] = [];
  const all = [fp.year.branch, fp.month.branch, fp.day.branch, ...(fp.hour ? [fp.hour.branch] : [])] as Branch[];
  const yb = fp.year.branch;
  const dm = fp.day.stem;
  const ym = YEOKMA_MAP[yb];
  if (ym) { const f = all.filter(b => b === ym); if (f.length) result.push({ name: '역마살', desc: '이동·변화·활동성', branches: f }); }
  const dh = DOHWA_MAP[yb];
  if (dh) { const f = all.filter(b => b === dh); if (f.length) result.push({ name: '도화살', desc: '매력·인기·예술성', branches: f }); }
  const gt = (GUI_MAP[dm] ?? []) as Branch[];
  const gf = all.filter(b => gt.includes(b));
  if (gf.length) result.push({ name: '천을귀인', desc: '귀인 도움·위기 극복', branches: gf });
  const yi = YANGIN_MAP[dm];
  if (yi) { const f = all.filter(b => b === yi); if (f.length) result.push({ name: '양인살', desc: '강한 의지·공격성', branches: f }); }
  const hg = HWAGAE_MAP[yb];
  if (hg) { const f = all.filter(b => b === hg); if (f.length) result.push({ name: '화개살', desc: '예술·학문·종교 기질', branches: f }); }
  return result;
}

// ── 타입 ──

export interface SinsalResult {
  name:     string;
  desc:     string;
  branches: Branch[];
}

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
  /** 신강/신약/중화 — advanced 정량화 기반 */
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
  /** advanced 레이어 분석 결과 */
  advanced: AdvancedAnalysis;
  /** 사용자 이름 (있으면 AI 호칭 개인화) */
  name?: string;
  /** 현재 고민 (있으면 AI 맥락 주입) */
  concern?: string;
  /** 이 차트에서 가장 두드러진 팩트 3-8개 — LLM anchoring용 */
  notableSignals: string[];
  /** LLM이 단정 해석을 피해야 하는 주의사항 */
  cautions: string[];
  /** 신살 (역마·도화·천을귀인·양인·화개) */
  sinsal: SinsalResult[];
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
  readingType: 'full' | 'today' | 'love' | 'career' = 'full',
  opts: { name?: string; concern?: string; daysFromJie?: number } = {},
): SajuFactSheet {
  const dm       = fp.day.stem;
  const dmData   = STEM_DATA[dm];
  const dmProfile = DAY_MASTER_PROFILE[dm];

  // ── advanced 분석 ──
  const adv = analyzeAdvanced(fp, opts.daysFromJie ?? 15);

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

  // ── 신강/신약 — advanced 정량화 결과 사용 ──
  const bodyStrength = adv.bodyStrength;

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

  // 격국
  notableSignals.push(
    `격국: ${adv.geokGuk.name}` +
    (adv.geokGuk.projected ? ' (투간 확인)' : ' (투간 미확인, 추정)') +
    ` [${adv.geokGuk.confidence}]`
  );

  // 용신/기신
  notableSignals.push(
    `용신: ${adv.yongSin.yongsin}(${adv.yongSin.label}) — 기신: ${adv.yongSin.gisin} [억부법, heuristic]`
  );

  // 신강/신약 (정량화 기반)
  const strengthLabel = {
    strong:  `신강 (자비 ${Math.round(adv.strengths.ratios[STEM_DATA[dm].element] * 100)}% 수준)`,
    weak:    `신약 (자비 ${Math.round(adv.strengths.ratios[STEM_DATA[dm].element] * 100)}% 수준)`,
    neutral: '중화',
  }[bodyStrength];
  notableSignals.push(strengthLabel);

  // 사령신
  notableSignals.push(
    `사령신: ${adv.strengths.salyeong.stem}(${adv.strengths.salyeong.element}) — ${adv.strengths.salyeong.pos === 'jeongi' ? '정기' : adv.strengths.salyeong.pos === 'junggi' ? '중기' : '여기'} 당령`
  );

  // 천간합
  for (const sc of adv.hapChung.stemCombines) {
    notableSignals.push(
      `천간합 ${sc.a}${sc.b} → ${sc.transformed}화 ${sc.formed ? '성립(합화)' : '불성립(합이불화, 기반)'}`
    );
  }

  // 지지합
  for (const bh of adv.hapChung.branchHaps) {
    notableSignals.push(`지지 ${bh.type}: ${bh.branches.join('')} → ${bh.element}기운 강화`);
  }

  // 지지충
  for (const [a, b] of adv.hapChung.branchChungs) {
    notableSignals.push(`지지충: ${a}${b}충 — 해당 기둥 불안정, 변동성`);
  }

  // 오행 세력 과다·부재 (가중 기준)
  for (const el of ELEMENTS) {
    const ratio = adv.strengths.ratios[el];
    if (ratio >= 0.40) {
      notableSignals.push(`${el} 세력 과다 (${Math.round(ratio*100)}%) — 해당 오행 성향 강하게 발현`);
    } else if (ratio < 0.02) {
      notableSignals.push(`${el} 세력 거의 없음 — 해당 오행 에너지 부족`);
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

  // 대운 이른/늦음
  const daeunAge = fp.daeun[0]?.startAge ?? 0;
  if (daeunAge <= 3) notableSignals.push(`대운 ${daeunAge}세 시작 — 매우 이른 대운 진입`);
  else if (daeunAge >= 8) notableSignals.push(`대운 ${daeunAge}세 시작 — 늦은 대운 진입`);

  // 시주 미상
  if (!fp.hour) notableSignals.push('시주 미입력 — 시간 관련 궁(직업·노년) 해석 불가');

  // 신살
  const sinsal = computeSinsal(fp);
  for (const s of sinsal) {
    notableSignals.push(`${s.name}(${s.branches.join('')}): ${s.desc}`);
  }

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
    advanced: adv,
    name:    opts.name    || undefined,
    concern: opts.concern || undefined,
    notableSignals,
    cautions,
    sinsal,
  };
}
