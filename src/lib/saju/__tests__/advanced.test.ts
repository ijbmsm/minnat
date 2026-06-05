/**
 * advanced.ts 단위 테스트
 *
 * 테스트 범위:
 *  - 사령(calcSalyeong) 경계 케이스
 *  - 합화 성립/불성립 (analyzeAdvanced 통해 검증)
 *  - 신강/신약/중화 (calcBodyStrength)
 *  - 격국 (determineGeokGuk: 건록·양인·십신격)
 *  - 종격 가드 (isJonggyeok → 억부 부적용)
 *  - 통근 (findRoots)
 *  - 오행 세력 정량화 (calcElementStrengths)
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import {
  buildSeolgiIndex,
  type SeolgiRow,
} from '../seolgi-loader';
import { computeFourPillars, fromKST, type FourPillars, type Pillar } from '../engine';
import {
  calcSalyeong,
  calcElementStrengths,
  calcBodyStrength,
  determineGeokGuk,
  determineYongSin,
  analyzeAdvanced,
  findRoots,
  DEFAULT_SCHOOL,
  JIJANGGAN,
} from '../advanced';
import { STEMS, BRANCHES, STEM_DATA, type Stem, type Branch } from '../constants';

// ── 절기 인덱스 로드 ──
function loadIndex() {
  const filePath = join(process.cwd(), 'public', 'seolgi.json');
  const rows: SeolgiRow[] = JSON.parse(readFileSync(filePath, 'utf-8'));
  return buildSeolgiIndex(rows);
}
const INDEX = loadIndex();

function calc(
  year: number, month: number, day: number,
  hour: number | null, sex: 'male' | 'female',
  opts: { minute?: number; longitude?: number } = {},
): FourPillars {
  const birth = fromKST(year, month, day, hour, opts.minute ?? 0, opts.longitude ?? 127.0);
  return computeFourPillars(INDEX, birth, sex);
}

/** 테스트용 최소 Pillar 생성 */
function makePillar(stem: Stem, branch: Branch): Pillar {
  const si = STEMS.indexOf(stem);
  const bi = BRANCHES.indexOf(branch);
  return { stem, branch, gz: ((si * 6 - bi * 5) % 60 + 60) % 60 };
}

/** 테스트용 최소 FourPillars 구성 (trace 필드는 날짜 무관한 테스트용 stub) */
function makeFP(
  y: Pillar, m: Pillar, d: Pillar, h: Pillar | null = null,
  jieUTC = '2024-01-06T00:00:00Z',
  birthUTC = '2024-01-21T00:00:00Z',
): FourPillars {
  return {
    year: y, month: m, day: d, hour: h,
    daeun: [],
    trace: {
      sajuYear: 2024,
      ipchunUTC: '2024-02-04T08:26:00Z',
      monthTermName: '소한',
      jieUTC,
      birthUTC,
      dayBoundaryRule: 'midnight',
      dayRolled: false,
      effectiveSolarDate: { year: 2024, month: 1, day: 21 },
      dayPillarOffset: 49,
      boundaryCaution: false,
      timeKnown: h !== null,
    },
  };
}

/** trace 기반 daysFromJie 계산 (factsheet.ts와 동일 방식) */
function daysFromJieFP(fp: FourPillars): number {
  return Math.max(
    0,
    Math.floor(
      (new Date(fp.trace.birthUTC).getTime() - new Date(fp.trace.jieUTC).getTime()) / 86_400_000,
    ),
  );
}

// ─────────────────────────────────────────
describe('사령(calcSalyeong) — 지장간 경계 케이스', () => {

  it('子月 여기 경계 — daysFromJie=0 → 임(壬, yeogi)', () => {
    const r = calcSalyeong('자', 0);
    expect(r.stem).toBe('임');
    expect(r.pos).toBe('yeogi');
  });

  it('子月 여기 마지막 — daysFromJie=10 → 임(壬, yeogi)', () => {
    // JIJANGGAN['자']: 임(10일). cumulative=10, 10≤10 → 임
    const r = calcSalyeong('자', 10);
    expect(r.stem).toBe('임');
    expect(r.pos).toBe('yeogi');
  });

  it('子月 정기 진입 — daysFromJie=11 → 계(癸, jeongi)', () => {
    const r = calcSalyeong('자', 11);
    expect(r.stem).toBe('계');
    expect(r.pos).toBe('jeongi');
  });

  it('寅月 여기 경계 — daysFromJie=7 → 무(戊, yeogi)', () => {
    // JIJANGGAN['인']: 무(7), 병(7), 갑(16)
    const r = calcSalyeong('인', 7);
    expect(r.stem).toBe('무');
    expect(r.pos).toBe('yeogi');
  });

  it('寅月 중기 진입 — daysFromJie=8 → 병(丙, junggi)', () => {
    const r = calcSalyeong('인', 8);
    expect(r.stem).toBe('병');
    expect(r.pos).toBe('junggi');
  });

  it('寅月 중기 경계 — daysFromJie=14 → 병(丙, junggi)', () => {
    // cumulative: 7, 14. daysFromJie=14 ≤ 14 → 병
    const r = calcSalyeong('인', 14);
    expect(r.stem).toBe('병');
    expect(r.pos).toBe('junggi');
  });

  it('寅月 정기 진입 — daysFromJie=15 → 갑(甲, jeongi)', () => {
    const r = calcSalyeong('인', 15);
    expect(r.stem).toBe('갑');
    expect(r.pos).toBe('jeongi');
  });

  it('丑月 삼분야 경계 — daysFromJie=9/12/13', () => {
    // 축: 계(9), 신(3), 기(18). 누적: 9, 12, 30
    expect(calcSalyeong('축', 9).stem).toBe('계');   // 9 ≤ 9
    expect(calcSalyeong('축', 10).stem).toBe('신');  // 10 > 9, ≤ 12
    expect(calcSalyeong('축', 12).stem).toBe('신');  // 12 ≤ 12
    expect(calcSalyeong('축', 13).stem).toBe('기');  // 13 > 12
  });

  it('모든 지지 월 정기(jeongi)가 존재 — 30일 이상에서 정기 반환', () => {
    for (const branch of BRANCHES) {
      const r = calcSalyeong(branch, 30);
      expect(r.pos).toBe('jeongi');
    }
  });

  it('daysFromJie 기록 — 반환값에 입력값 그대로 보존', () => {
    const r = calcSalyeong('오', 5);
    expect(r.daysFromJie).toBe(5);
  });

});

// ─────────────────────────────────────────
describe('통근(findRoots) — 천간의 지지 뿌리 탐색', () => {

  it('甲(목)이 寅地支에서 정기근(jeongi, bonus=1.5) 통근', () => {
    const roots = findRoots('갑', ['인']);
    expect(roots.length).toBeGreaterThan(0);
    const jeongiRoot = roots.find(r => r.branch === '인' && r.pos === 'jeongi');
    expect(jeongiRoot).toBeDefined();
    expect(jeongiRoot?.bonus).toBe(1.5);
  });

  it('壬(수)이 亥地支에서 정기근 통근', () => {
    const roots = findRoots('임', ['해']);
    const jeongiRoot = roots.find(r => r.branch === '해' && r.pos === 'jeongi');
    expect(jeongiRoot).toBeDefined();
    expect(jeongiRoot?.bonus).toBe(1.5);
  });

  it('甲(목)이 申地支에서는 통근 없음', () => {
    // 申: 무(토), 임(수), 경(금) — 목 없음
    const roots = findRoots('갑', ['신']);
    expect(roots.length).toBe(0);
  });

  it('중기근 bonus=1.2', () => {
    // 壬(수)가 申地支의 중기근 임(수, junggi)에 통근
    // JIJANGGAN['신'] = [무(토,yeogi), 임(수,junggi), 경(금,jeongi)]
    const roots = findRoots('임', ['신']);
    const junggiRoot = roots.find(r => r.branch === '신' && r.pos === 'junggi');
    expect(junggiRoot).toBeDefined();
    expect(junggiRoot?.bonus).toBe(1.2);
  });

  it('여기근 bonus=1.1', () => {
    // 壬(수)가 子地支의 여기근 임(수, yeogi)에 통근
    // JIJANGGAN['자'] = [임(수,yeogi), 계(수,jeongi)]
    const roots = findRoots('임', ['자']);
    const yeogiRoot = roots.find(r => r.branch === '자' && r.pos === 'yeogi');
    expect(yeogiRoot).toBeDefined();
    expect(yeogiRoot?.bonus).toBe(1.1);
  });

});

// ─────────────────────────────────────────
describe('합화 성립/불성립', () => {

  it('甲己합화土 성립 — dist=1, 土月(丑月)에서 formed=true', () => {
    // 년甲, 월己 → dist=1 강합. 丑月=토. 토旺(1.4)≥1.2 → formed=true
    const fp = makeFP(
      makePillar('갑', '진'),  // 년
      makePillar('기', '축'),  // 월 ← 丑月(토), 己 포함
      makePillar('병', '오'),  // 일
      makePillar('임', '자'),  // 시
    );
    const adv = analyzeAdvanced(fp, 15);
    const combine = adv.hapChung.stemCombines.find(c => c.a === '갑' && c.b === '기');
    expect(combine).toBeDefined();
    expect(combine?.formed).toBe(true);
    expect(combine?.strength).toBe('강');
  });

  it('甲己합화土 불성립 — dist=3 원격', () => {
    // 년甲, 시己 → dist=3. dist>2 → formed=false
    const fp = makeFP(
      makePillar('갑', '자'),  // 년
      makePillar('병', '오'),  // 월
      makePillar('무', '자'),  // 일
      makePillar('기', '해'),  // 시
    );
    const adv = analyzeAdvanced(fp, 15);
    const combine = adv.hapChung.stemCombines.find(c => c.a === '갑' && c.b === '기');
    expect(combine).toBeDefined();
    expect(combine?.formed).toBe(false);
    expect(combine?.strength).toBe('원격');
  });

  it('甲己합화土 불성립 — dist=1이지만 水月(子月)에서 토 계수 0.8 < 1.2', () => {
    // 子月 월령=수. getSeasonCoeff('토','수')=囚=0.8 < 1.2 → formed=false
    const fp = makeFP(
      makePillar('갑', '오'),  // 년
      makePillar('기', '자'),  // 월 ← 子月(수), 己 포함, dist=1
      makePillar('병', '인'),  // 일
      makePillar('임', '신'),  // 시
    );
    const adv = analyzeAdvanced(fp, 15);
    const combine = adv.hapChung.stemCombines.find(c => c.a === '갑' && c.b === '기');
    expect(combine).toBeDefined();
    expect(combine?.formed).toBe(false);
  });

  it('육합 子丑합 탐지', () => {
    const fp = makeFP(
      makePillar('갑', '자'),
      makePillar('을', '축'),
      makePillar('병', '인'),
      makePillar('정', '묘'),
    );
    const adv = analyzeAdvanced(fp, 15);
    const yukhap = adv.hapChung.branchHaps.find(h => h.type === '육합');
    expect(yukhap).toBeDefined();
    expect(yukhap?.element).toBe('토');
  });

  it('삼합 申子辰 수국 탐지', () => {
    const fp = makeFP(
      makePillar('경', '신'),  // 申
      makePillar('임', '자'),  // 子
      makePillar('무', '진'),  // 辰
      makePillar('갑', '인'),
    );
    const adv = analyzeAdvanced(fp, 15);
    const samhap = adv.hapChung.branchHaps.find(h => h.type === '삼합' && h.element === '수');
    expect(samhap).toBeDefined();
    expect(samhap?.branches).toContain('신');
    expect(samhap?.branches).toContain('자');
    expect(samhap?.branches).toContain('진');
  });

  it('반합(loose) 申子(왕지子 포함) — 수국 반합', () => {
    const fp = makeFP(
      makePillar('경', '신'),  // 申
      makePillar('임', '자'),  // 子(왕지)
      makePillar('무', '오'),
      makePillar('갑', '인'),
    );
    const adv = analyzeAdvanced(fp, 15, DEFAULT_SCHOOL);
    const banhap = adv.hapChung.branchHaps.find(h => h.type === '반합' && h.element === '수');
    expect(banhap).toBeDefined();
  });

  it('육충 子午충 탐지', () => {
    const fp = makeFP(
      makePillar('갑', '자'),
      makePillar('병', '오'),
      makePillar('무', '인'),
      makePillar('경', '신'),
    );
    const adv = analyzeAdvanced(fp, 15);
    expect(adv.hapChung.branchChungs).toContainEqual(['자', '오']);
  });

});

// ─────────────────────────────────────────
describe('신강/신약/중화 (calcBodyStrength)', () => {

  it('신강(strong) — 甲木일간 + 木旺月 + 木水 압도 사주', () => {
    // 년甲寅(목목), 월壬子(수수, 子月=수旺), 일甲子(목수), 시壬子(수수)
    // (일간+인성) = 목+수 → 전체의 ~97% >> 0.58 → strong
    const fp = makeFP(
      makePillar('갑', '인'),
      makePillar('임', '자'),  // 子月 = 수
      makePillar('갑', '자'),
      makePillar('임', '자'),
    );
    const strengths = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, strengths);
    expect(body).toBe('strong');
  });

  it('신약(weak) — 甲木일간 + 金旺月 + 金 압도 사주', () => {
    // 년庚申(금금), 월庚申(금금, 申月=금旺), 일甲申(목금), 시庚申(금금)
    // (일간+인성) = 목+수 → 전체의 ~17% << 0.42 → weak
    const fp = makeFP(
      makePillar('경', '신'),
      makePillar('경', '신'),  // 申月 = 금
      makePillar('갑', '신'),
      makePillar('경', '신'),
    );
    const strengths = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, strengths);
    expect(body).toBe('weak');
  });

  it('신강 사주의 自比 비율이 신약 사주보다 높음', () => {
    const strongFP = makeFP(
      makePillar('갑', '인'),
      makePillar('임', '자'),
      makePillar('갑', '자'),
      makePillar('임', '자'),
    );
    const weakFP = makeFP(
      makePillar('경', '신'),
      makePillar('경', '신'),
      makePillar('갑', '신'),
      makePillar('경', '신'),
    );
    const sStr = calcElementStrengths(strongFP, 15);
    const wStr = calcElementStrengths(weakFP, 15);

    const strongDmEl = STEM_DATA[strongFP.day.stem].element;
    const weakDmEl   = STEM_DATA[weakFP.day.stem].element;

    expect(sStr.ratios[strongDmEl]).toBeGreaterThan(wStr.ratios[weakDmEl]);
  });

  it('오행 세력 합산 = total (ratios 합 ≈ 1)', () => {
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    const days = daysFromJieFP(fp);
    const str = calcElementStrengths(fp, days);
    const ratioSum = Object.values(str.ratios).reduce((s, v) => s + v, 0);
    expect(ratioSum).toBeCloseTo(1.0, 5);
  });

});

// ─────────────────────────────────────────
describe('격국(determineGeokGuk)', () => {

  it('건록격 — 甲일간 + 寅月 (ROK_IDX[갑]=2=寅)', () => {
    // 2024-02-10: 甲辰日, 甲辰年, 丙寅月(입춘 이후 인월)
    const fp = calc(2024, 2, 10, 12, 'male');
    expect(fp.day.stem).toBe('갑');
    expect(fp.month.branch).toBe('인');
    const days = daysFromJieFP(fp);
    const guk = determineGeokGuk(fp, days);
    expect(guk.name).toBe('건록격');
    expect(guk.confidence).toBe('deterministic');
  });

  it('양인격 — 甲일간 + 卯月 (YANGIN_IDX[갑]=3=卯)', () => {
    // 2024-03-11: 甲戌日, 甲辰年, 丁卯月(경칩 이후 묘월)
    const fp = calc(2024, 3, 11, 12, 'male');
    expect(fp.day.stem).toBe('갑');
    expect(fp.month.branch).toBe('묘');
    const days = daysFromJieFP(fp);
    const guk = determineGeokGuk(fp, days);
    expect(guk.name).toBe('양인격');
    expect(guk.confidence).toBe('deterministic');
  });

  it('壬일간 + 건록격 — ROK_IDX[임]=11=亥', () => {
    // 壬日 + 亥月 = 건록격
    // 아무 壬일간 + 亥月 사주 수동 구성
    const fp = makeFP(
      makePillar('갑', '자'),
      makePillar('임', '해'),  // 亥月
      makePillar('임', '자'),  // 壬일간
      null,
    );
    // daysFromJie=15
    const guk = determineGeokGuk(fp, 15);
    expect(guk.name).toBe('건록격');
    expect(guk.confidence).toBe('deterministic');
  });

  it('壬일간 + 양인격 — YANGIN_IDX[임]=0=子', () => {
    const fp = makeFP(
      makePillar('갑', '인'),
      makePillar('임', '자'),  // 子月
      makePillar('임', '인'),  // 壬일간
      null,
    );
    const guk = determineGeokGuk(fp, 15);
    expect(guk.name).toBe('양인격');
    expect(guk.confidence).toBe('deterministic');
  });

  it('십신격 투간 — 사령신이 천간에 투간되면 deterministic', () => {
    // 壬일간 + 巳月(daysFromJie=24→사령=丙정기) + 丙 천간 존재
    const fp = makeFP(
      makePillar('병', '인'),  // 丙 투간 ← 사령신과 동일
      makePillar('임', '사'),  // 巳月
      makePillar('임', '자'),  // 壬일간
      null,
      '2024-05-05T00:00:00Z',
      '2024-05-29T00:00:00Z',  // daysFromJie≈24
    );
    const guk = determineGeokGuk(fp, 24);
    expect(guk.sipshin).toBe('편재');  // 壬水 일간에서 丙火 = 편재
    expect(guk.projected).toBe(true);
    expect(guk.confidence).toBe('deterministic');
  });

  it('십신격 미투간 — 사령신이 천간에 없으면 heuristic', () => {
    // 壬일간 + 巳月(사령=丙) + 丙 없음
    const fp = makeFP(
      makePillar('갑', '인'),
      makePillar('경', '사'),  // 巳月, 庚 없음
      makePillar('임', '자'),  // 壬일간
      null,
    );
    const guk = determineGeokGuk(fp, 24);
    expect(guk.projected).toBe(false);
    expect(guk.confidence).toBe('heuristic');
  });

  it('건록격/양인격이 십신격보다 우선 판정', () => {
    // 壬일간 + 亥月. 亥月 사령(daysFromJie=15)=임(壬, jeongi). 壬=비겁.
    // 建祿(ROK_IDX['임']=11=亥) 조건 먼저 → 건록격
    const fp = makeFP(
      makePillar('갑', '자'),
      makePillar('임', '해'),  // 亥月
      makePillar('임', '자'),  // 壬일간
      null,
    );
    const guk = determineGeokGuk(fp, 15);
    expect(guk.name).toBe('건록격');  // 십신격(비견격)이 아닌 건록격
  });

});

// ─────────────────────────────────────────
describe('종격 가드 — isJonggyeok → 억부 부적용', () => {

  it('한 오행 ≥70% → 억부 미적용, dominant 오행 용신 반환', () => {
    // 년甲寅(목목), 월甲寅(목목, 寅月=목), 일乙卯(목목), 시甲卯(목목)
    // 모든 8글자가 목 → 목 비율 >>70% → 종격
    const fp = makeFP(
      makePillar('갑', '인'),
      makePillar('갑', '인'),  // 寅月
      makePillar('을', '묘'),
      makePillar('갑', '묘'),
    );
    const strengths = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, strengths);
    const ys = determineYongSin(fp, body, strengths);
    expect(ys.yongsin).toBe('목');
    expect(ys.label).toContain('종격');
    expect(ys.confidence).toBe('heuristic');
  });

  it('종격이 아닌 일반 사주에서 억부 정상 적용', () => {
    // 혼합 오행 사주 → 종격 조건 미충족
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    const days = daysFromJieFP(fp);
    const adv = analyzeAdvanced(fp, days);
    // 1999-04-04는 기묘년+정묘월+병술일+경인시 → 오행 분산, 종격 아님
    expect(adv.yongSin.label).not.toContain('종격');
  });

  it('종격 임계값 커스텀 — threshold=0.50이면 더 쉽게 종격 판정', () => {
    // 목 비율 60% 사주 + 엄격하지 않은 threshold
    const fp = makeFP(
      makePillar('갑', '인'),
      makePillar('갑', '인'),  // 寅月
      makePillar('을', '묘'),
      makePillar('임', '자'),  // 壬子(수) 하나만 섞음
    );
    const str = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, str);
    // 기본(0.70)로는 종격이 아닐 수도 있지만 확인
    const ysDefault = determineYongSin(fp, body, str);
    const ysLoose   = determineYongSin(fp, body, str, { ...DEFAULT_SCHOOL, jonggyeokThreshold: 0.50 });
    // 낮은 임계값이면 종격 확률 높음
    if (str.ratios['목'] >= 0.50) {
      expect(ysLoose.label).toContain('종격');
    }
    if (str.ratios['목'] < 0.70) {
      expect(ysDefault.label).not.toContain('종격');
    }
  });

});

// ─────────────────────────────────────────
describe('용신(determineYongSin) — 억부법', () => {

  it('신강 → 설기·극제(식상·재·관) 중 가장 부족한 오행 용신', () => {
    // 甲목일간, 寅月(목旺), 목+수≈83% → 신강. 목비율≈57.8% < 70%(종격미달)
    // 년甲午+월壬寅+일甲子+시癸卯: 식상(화)·재(토)·관(금) 중 금=0 → 용신=금
    const fp = makeFP(
      makePillar('갑', '오'),
      makePillar('임', '인'),  // 寅月
      makePillar('갑', '자'),
      makePillar('계', '묘'),
    );
    const str = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, str);
    const ys = determineYongSin(fp, body, str);
    expect(body).toBe('strong');
    // 용신은 식상(화)·재(토)·관(금) 중 하나
    expect(['화', '토', '금']).toContain(ys.yongsin);
    expect(ys.confidence).toBe('heuristic');
  });

  it('신약 → 인성·비겁 중 가장 부족한 오행 용신', () => {
    // 甲목일간, 申月(금旺), 금비율≈59% < 70%(종격미달), 목+수≈27% → 신약
    // 년甲午+월庚申+일甲申+시庚子: 인성(수)·비겁(목) 중 목=1.2 < 수=3.24 → 용신=목
    const fp = makeFP(
      makePillar('갑', '오'),
      makePillar('경', '신'),  // 申月
      makePillar('갑', '신'),
      makePillar('경', '자'),
    );
    const str = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, str);
    const ys = determineYongSin(fp, body, str);
    expect(body).toBe('weak');
    expect(['수', '목']).toContain(ys.yongsin);
    expect(ys.confidence).toBe('heuristic');
  });

  it('용신 원국 부재 — present=false이면 note 존재', () => {
    // 甲목일간, 신약, 金만 있어서 용신(수)이 원국에 없는 경우
    const fp = makeFP(
      makePillar('경', '신'),
      makePillar('경', '신'),  // 申月 (금)
      makePillar('갑', '신'),  // 甲목 일간, 申(금)지지
      makePillar('경', '신'),
    );
    const str = calcElementStrengths(fp, 15);
    const body = calcBodyStrength(fp, str);
    const ys = determineYongSin(fp, body, str);
    if (!ys.present) {
      expect(ys.note).toContain('원국');
    }
  });

  it('중화 사주 — yongsin=null, gisin=null', () => {
    // calcBodyStrength가 neutral을 반환하면 억부 미적용
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    const days = daysFromJieFP(fp);
    const str = calcElementStrengths(fp, days);
    const body = calcBodyStrength(fp, str);
    if (body === 'neutral') {
      const ys = determineYongSin(fp, body, str);
      expect(ys.yongsin).toBeNull();
      expect(ys.gisin).toBeNull();
      expect(ys.label).toBe('중화');
    } else {
      // 이 명식이 중화가 아닐 경우, 기본 억부 동작 확인
      const ys = determineYongSin(fp, body, str);
      expect(ys.yongsin).not.toBeNull();
    }
  });

});

// ─────────────────────────────────────────
describe('analyzeAdvanced — 통합 결과 일관성', () => {

  it('결과 구조 완전성 — 5개 필드 모두 존재', () => {
    const fp = calc(1999, 4, 4, 5, 'male', { longitude: 127.0 });
    const days = daysFromJieFP(fp);
    const adv = analyzeAdvanced(fp, days);
    expect(adv.strengths).toBeDefined();
    expect(adv.bodyStrength).toMatch(/^(strong|neutral|weak)$/);
    expect(adv.hapChung).toBeDefined();
    expect(adv.geokGuk).toBeDefined();
    expect(adv.yongSin).toBeDefined();
  });

  it('applyHapHwa=true/false가 결과에 영향을 미칠 수 있음', () => {
    // 합화 성립 사주(년甲+월己, 丑月)에서 applyHapHwa 플래그 차이 확인
    const fp = makeFP(
      makePillar('갑', '진'),
      makePillar('기', '축'),  // 甲己합화土, 丑月(토旺)
      makePillar('병', '오'),
      makePillar('임', '자'),
    );
    const withHap    = calcElementStrengths(fp, 15, DEFAULT_SCHOOL, true);
    const withoutHap = calcElementStrengths(fp, 15, DEFAULT_SCHOOL, false);
    // 합화 적용 시 토 점수가 더 높아야 함 (甲→土로 변환)
    expect(withHap.scores['토']).toBeGreaterThanOrEqual(withoutHap.scores['토']);
  });

  it('모든 지지의 지장간 가중합이 월별로 정확히 계산됨', () => {
    // 각 Branch의 JIJANGGAN days 합산 = 30 검증
    for (const branch of BRANCHES) {
      const total = JIJANGGAN[branch].reduce((s, h) => s + h.days, 0);
      expect(total).toBe(30);
    }
  });

  it('SchoolProfile loose/strict 반합 차이 확인', () => {
    // 申子 (申자 = 삼합 申子辰 중 辰 없음) → loose면 반합, strict+왕지(子) 포함이면 반합
    const fp = makeFP(
      makePillar('경', '신'),  // 申
      makePillar('임', '자'),  // 子(왕지)
      makePillar('무', '인'),
      makePillar('갑', '오'),
    );
    const loose  = analyzeAdvanced(fp, 15, { ...DEFAULT_SCHOOL, halfHapRule: 'loose' });
    const strict = analyzeAdvanced(fp, 15, { ...DEFAULT_SCHOOL, halfHapRule: 'strict' });

    // loose: 반합 탐지
    const looseHap = loose.hapChung.branchHaps.find(h => h.type === '반합' && h.element === '수');
    expect(looseHap).toBeDefined();

    // strict: 왕지(子) 포함이므로 역시 반합 성립
    const strictHap = strict.hapChung.branchHaps.find(h => h.type === '반합' && h.element === '수');
    expect(strictHap).toBeDefined();
  });

});
