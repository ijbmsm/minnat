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

// 역마살: 연지 기준
const YEOKMA_MAP: Partial<Record<Branch, Branch>> = {
  인:'신', 오:'신', 술:'신', 신:'인', 자:'인', 진:'인',
  사:'해', 유:'해', 축:'해', 해:'사', 묘:'사', 미:'사',
};
// 도화살: 연지 기준
const DOHWA_MAP: Partial<Record<Branch, Branch>> = {
  인:'묘', 오:'묘', 술:'묘', 사:'오', 유:'오', 축:'오',
  신:'유', 자:'유', 진:'유', 해:'자', 묘:'자', 미:'자',
};
// 양인살: 일간 기준 (신살용 — 건록격 판정과 동일 테이블 활용)
const YANGIN_SINSAL_MAP: Partial<Record<Stem, Branch>> = {
  갑:'묘', 병:'오', 무:'오', 경:'유', 임:'자',
};
// 화개살: 연지 기준
const HWAGAE_MAP: Partial<Record<Branch, Branch>> = {
  인:'술', 오:'술', 술:'술', 사:'축', 유:'축', 축:'축',
  신:'진', 자:'진', 진:'진', 해:'미', 묘:'미', 미:'미',
};
// 천을귀인: 일간 기준
const GUI_MAP: Partial<Record<Stem, Branch[]>> = {
  갑:['축','미'], 무:['축','미'], 경:['축','미'],
  을:['자','신'], 기:['자','신'],
  병:['해','유'], 정:['해','유'],
  신:['인','오'],
  임:['묘','사'], 계:['묘','사'],
};
// 백호대살: 일주(day pillar) 간지 조합 — 특정 간지 자체가 백호대살
const BAEKHO_PILLARS = new Set<string>([
  '갑진','을미','병술','정축','무진','임술','계축',
]);
// 원진살: 지지 쌍 (양방향)
const WONJIN_PAIRS: [Branch, Branch][] = [
  ['자','미'], ['축','오'], ['인','유'], ['묘','신'], ['진','해'], ['사','술'],
];
// 귀문관살: 지지 쌍 (양방향) — 자평진전 계열
const GWIMUN_PAIRS: [Branch, Branch][] = [
  ['자','유'], ['축','오'], ['인','미'], ['묘','신'], ['진','해'], ['사','술'],
];

// ── 12신살(十二神煞) 삼합 기반 사이클 ──
// 삼합국 계열별 12살 순서 (겁살→재살→천살→지살→년살→월살→망신살→장성살→반안살→역마살→육해살→화개살)
// 인오술(火局): 겁=亥 재=子 천=丑 지=寅 년(도화)=卯 월=辰 망신=巳 장성=午 반안=未 역마=申 육해=酉 화개=戌
// 신자진(水局): 겁=巳 재=午 천=未 지=申 년=酉 월=戌 망신=亥 장성=子 반안=丑 역마=寅 육해=卯 화개=辰
// 사유축(金局): 겁=寅 재=卯 천=辰 지=巳 년=午 월=未 망신=申 장성=酉 반안=戌 역마=亥 육해=子 화개=丑
// 해묘미(木局): 겁=申 재=酉 천=戌 지=亥 년=子 월=丑 망신=寅 장성=卯 반안=辰 역마=巳 육해=午 화개=未

type ShinsalName12 =
  | '겁살' | '재살' | '천살' | '지살' | '망신살'
  | '장성살' | '반안살' | '육해살';

interface ShinsalDef12 {
  name: ShinsalName12;
  desc: string;
  idx: number;  // 12신살 순서 인덱스 (0=겁살..11=화개살)
}

const SINSAL12_DEFS: readonly ShinsalDef12[] = [
  { name: '겁살',   desc: '외부 충격·횡재·사고 변수',    idx: 0  },
  { name: '재살',   desc: '관재·구설·법적 분쟁 위험',     idx: 1  },
  { name: '천살',   desc: '예기치 않은 재난·하늘의 시련', idx: 2  },
  { name: '지살',   desc: '이동·출장·지방 이민 기질',      idx: 3  },
  // 년살(도화) = idx 4 → 기존 도화살과 통합
  // 월살(고초살) = idx 5 → 별도 추가하지 않음 (실용성 낮음)
  { name: '망신살', desc: '명예 손상·수치심 사건 경향',   idx: 6  },
  { name: '장성살', desc: '권위·강한 의지·리더 기질',     idx: 7  },
  { name: '반안살', desc: '안정 추구·현실 안주·보수 성향', idx: 8  },
  // 역마살 = idx 9 → 기존 역마살과 통합
  { name: '육해살', desc: '인간관계 갈등·배신·악연 경향', idx: 10 },
  // 화개살 = idx 11 → 기존 화개살과 통합
] as const;

// 삼합 계열별 겁살 시작지지 (年支 기준)
const SAMHAP_GEOP_START: Partial<Record<Branch, Branch>> = {
  인: '해', 오: '해', 술: '해',   // 인오술 계열 → 겁살=亥
  신: '사', 자: '사', 진: '사',   // 신자진 계열 → 겁살=巳
  사: '인', 유: '인', 축: '인',   // 사유축 계열 → 겁살=寅
  해: '신', 묘: '신', 미: '신',   // 해묘미 계열 → 겁살=申
};

function compute12Sinsal(fp: FourPillars): SinsalResult[] {
  const result: SinsalResult[] = [];
  const allBranches = [
    fp.year.branch, fp.month.branch, fp.day.branch,
    ...(fp.hour ? [fp.hour.branch] : []),
  ] as Branch[];

  const yb = fp.year.branch;
  const geopStart = SAMHAP_GEOP_START[yb];
  if (!geopStart) return result;

  const startIdx = BRANCHES.indexOf(geopStart);
  if (startIdx === -1) return result;

  for (const def of SINSAL12_DEFS) {
    const targetBranch = BRANCHES[(startIdx + def.idx) % 12] as Branch;
    const found = allBranches.filter(b => b === targetBranch);
    if (found.length) {
      result.push({ name: def.name, desc: def.desc, branches: found });
    }
  }

  return result;
}

function computeSinsal(fp: FourPillars): SinsalResult[] {
  const result: SinsalResult[] = [];
  const allBranches = [
    fp.year.branch, fp.month.branch, fp.day.branch,
    ...(fp.hour ? [fp.hour.branch] : []),
  ] as Branch[];
  const yb = fp.year.branch;
  const dm = fp.day.stem;

  // 역마살
  const ym = YEOKMA_MAP[yb];
  if (ym) { const f = allBranches.filter(b => b === ym); if (f.length) result.push({ name: '역마살', desc: '이동·변화·활동성', branches: f }); }

  // 도화살
  const dh = DOHWA_MAP[yb];
  if (dh) { const f = allBranches.filter(b => b === dh); if (f.length) result.push({ name: '도화살', desc: '매력·인기·예술성', branches: f }); }

  // 천을귀인
  const gt = (GUI_MAP[dm] ?? []) as Branch[];
  const gf = allBranches.filter(b => gt.includes(b));
  if (gf.length) result.push({ name: '천을귀인', desc: '귀인 도움·위기 극복', branches: gf });

  // 양인살
  const yi = YANGIN_SINSAL_MAP[dm];
  if (yi) { const f = allBranches.filter(b => b === yi); if (f.length) result.push({ name: '양인살', desc: '강한 의지·공격성', branches: f }); }

  // 화개살
  const hg = HWAGAE_MAP[yb];
  if (hg) { const f = allBranches.filter(b => b === hg); if (f.length) result.push({ name: '화개살', desc: '예술·학문·종교 기질', branches: f }); }

  // 백호대살: 일주 간지 조합 체크
  const dayKey = `${fp.day.stem}${fp.day.branch}` as string;
  if (BAEKHO_PILLARS.has(dayKey)) {
    result.push({ name: '백호대살', desc: '강렬한 에너지·돌발 변수 (일주 기준)', branches: [fp.day.branch] });
  }

  // 원진살: 모든 지지 쌍 조합 검사
  for (const [a, b] of WONJIN_PAIRS) {
    if (allBranches.includes(a) && allBranches.includes(b)) {
      result.push({ name: '원진살', desc: '갈등·반목·소원 관계', branches: [a, b] });
    }
  }

  // 귀문관살: 모든 지지 쌍 조합 검사
  for (const [a, b] of GWIMUN_PAIRS) {
    if (allBranches.includes(a) && allBranches.includes(b)) {
      result.push({ name: '귀문관살', desc: '직관·예민함·집착 성향', branches: [a, b] });
    }
  }

  // 12신살 사이클 (겁살·재살·천살·지살·망신살·장성살·반안살·육해살)
  result.push(...compute12Sinsal(fp));

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
  /** 대운 배열 — 십신 포함 (연애운 타이밍 등 렌즈별 분석용) */
  daeun: Array<{
    startAge:     number;
    startYear:    number;
    stem:         Stem;
    branch:       Branch;
    sipshinStem:  Sipshin;
    sipshinBranch: Sipshin;
  }>;
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
  opts: { name?: string; concern?: string; applyHapHwa?: boolean } = {},
): SajuFactSheet {
  const dm       = fp.day.stem;
  const dmData   = STEM_DATA[dm];
  const dmProfile = DAY_MASTER_PROFILE[dm];

  // ── daysFromJie: trace의 canonical birthUTC 사용 (KST 재입력 금지)
  // Math.floor = 사령신은 "완성된 일수" 기준
  const daysFromJie = Math.max(
    0,
    Math.floor(
      (new Date(fp.trace.birthUTC).getTime() - new Date(fp.trace.jieUTC).getTime()) / 86_400_000
    ),
  );

  // ── advanced 분석 ──
  const adv = analyzeAdvanced(fp, daysFromJie, undefined, opts.applyHapHwa ?? false);

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

  // ── 세운 (올해 + 내년) — KST 기준 (UTC+9)
  const kstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const currentYear = kstNow.getUTCFullYear();
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

  // 용신/기신 (중화·종격은 null)
  if (adv.yongSin.yongsin) {
    const presentFlag = adv.yongSin.present ? '' : ' ⚠️원국부재';
    notableSignals.push(
      `용신: ${adv.yongSin.yongsin}(${adv.yongSin.label})${presentFlag} — 기신: ${adv.yongSin.gisin} [억부법, heuristic]`
    );
  } else {
    notableSignals.push(`용신: ${adv.yongSin.label} — ${adv.yongSin.reason}`);
  }
  if (adv.yongSin.note) {
    notableSignals.push(`[용신 메모] ${adv.yongSin.note}`);
  }

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

  // 방합
  for (const bh of adv.hapChung.banghaps) {
    const completeness = bh.complete ? '완전방합' : '반방합(2지)';
    notableSignals.push(`방합 ${bh.branches.join('')} → ${bh.element}기운 결집 (${completeness})`);
  }

  // 신살
  const sinsal = computeSinsal(fp);
  for (const s of sinsal) {
    notableSignals.push(`${s.name}(${s.branches.join('')}): ${s.desc}`);
  }

  // ── 도메인 렌즈 — readingType별 notableSignals 필터 ──
  // love/career는 route.ts의 전용 focusSignals가 대체하므로 minimal만 유지
  // today는 일진×원국 작용에 집중 → 핵심 팩트만
  const filteredSignals = (() => {
    if (readingType === 'today') {
      // 오늘의 운세: 신강약·격국·용신·사령신·합충·대운 이른/늦음만 (신살·십신집중 제외)
      return notableSignals.filter(s =>
        s.startsWith('격국') ||
        s.startsWith('용신') ||
        s.startsWith('[용신 메모]') ||
        s.startsWith('신강') || s.startsWith('신약') || s.startsWith('중화') ||
        s.startsWith('사령신') ||
        s.startsWith('천간합') || s.startsWith('지지 ') || s.startsWith('지지충') ||
        s.startsWith('대운 ')
      );
    }
    // full: 모든 신호 유지
    return notableSignals;
  })();

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
    daeun: fp.daeun.map(d => ({
      startAge:      d.startAge,
      startYear:     d.startYear,
      stem:          d.pillar.stem,
      branch:        d.pillar.branch,
      sipshinStem:   getSipshin(dm, d.pillar.stem),
      sipshinBranch: getBranchSipshin(dm, d.pillar.branch),
    })),
    seyun,
    advanced: adv,
    name:    opts.name    || undefined,
    concern: opts.concern || undefined,
    notableSignals: filteredSignals,
    cautions,
    sinsal,
  };
}
