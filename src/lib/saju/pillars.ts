import { STEMS, BRANCHES, STEM_DATA, BRANCH_DATA, type Stem, type Branch } from './constants';
import { getMonthTerm, getIpchunKST, daysToNextTerm, daysToPrevTerm } from './solar';

export interface Pillar { stem: Stem; branch: Branch }

// ── 년주 ──
function yearPillar(sajuYear: number): Pillar {
  const si = ((sajuYear - 4) % 10 + 10) % 10;
  const bi = ((sajuYear - 4) % 12 + 12) % 12;
  return { stem: STEMS[si], branch: BRANCHES[bi] };
}

// ── 월주 ──
// 인월(branchIdx=2)이 1번째 월
// 월간: 갑기→병 을경→무 병신→경 정임→임 무계→갑 (인월 기준 시작 천간)
const MONTH_START_STEM = [2, 4, 6, 8, 0]; // yearStemIdx % 5 → 인월 시작 천간 인덱스

function monthOrder(branchIdx: number): number {
  // 인(2)=0, 묘(3)=1, ..., 축(1)=11
  return ((branchIdx - 2) + 12) % 12;
}

function monthPillar(sajuYear: number, branchIdx: number): Pillar {
  const yearStemIdx = ((sajuYear - 4) % 10 + 10) % 10;
  const startStem   = MONTH_START_STEM[yearStemIdx % 5];
  const order       = monthOrder(branchIdx);
  const si          = (startStem + order) % 10;
  return { stem: STEMS[si], branch: BRANCHES[branchIdx] };
}

// ── 일주 ──
// 기준: 1900-01-01 = 갑자일 (dayIdx=0)
// JD of 1900-01-01 UTC midnight = 2415020.5
const BASE_JD = 2415020.5;

function dateToJD(y: number, m: number, d: number): number {
  if (m <= 2) { y--; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
}

function dayPillar(kst: Date): Pillar {
  const jd  = dateToJD(kst.getFullYear(), kst.getMonth() + 1, kst.getDate());
  const idx = ((Math.floor(jd - BASE_JD)) % 60 + 60) % 60;
  return { stem: STEMS[idx % 10], branch: BRANCHES[idx % 12] };
}

// ── 시주 ──
// 자시: 23~01시, 이후 2시간씩
const HOUR_START_STEM = [0, 2, 4, 6, 8]; // dayStemIdx % 5 → 자시 시작 천간 인덱스

function hourPillar(dayStem: Stem, hour: number): Pillar {
  const branchIdx = Math.floor((hour + 1) / 2) % 12;
  const dayStemIdx = STEMS.indexOf(dayStem);
  const startStem  = HOUR_START_STEM[dayStemIdx % 5];
  const stemIdx    = (startStem + branchIdx) % 10;
  return { stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

// ── 대운 ──
export interface Daeun {
  startAge: number;
  pillar: Pillar;
}

// 순행/역행 10년 대운 8개
function calcDaeun(
  monthBranchIdx: number,
  monthStem: Stem,
  kst: Date,
  yearStem: Stem,
  sex: 'male' | 'female',
): Daeun[] {
  const yearYang = STEM_DATA[yearStem].yang;
  const forward  = (sex === 'male' && yearYang) || (sex === 'female' && !yearYang);

  // 시작 나이 = 다음(순행) 또는 이전(역행) 절기까지 일수 / 3
  const days     = forward ? daysToNextTerm(kst) : daysToPrevTerm(kst);
  const startAge = Math.round(days / 3);

  // 월주에서 순행/역행으로 한 칸씩 이동 (60갑자)
  const msi = STEMS.indexOf(monthStem);
  const mbi = monthBranchIdx;
  const baseIdx = msi; // 60갑자 인덱스 = 천간 인덱스 기반으로 계산

  const result: Daeun[] = [];
  for (let n = 1; n <= 8; n++) {
    const step = forward ? n : -n;
    const si   = ((msi + step) % 10 + 10) % 10;
    const bi   = ((mbi + step) % 12 + 12) % 12;
    result.push({ startAge: startAge + (n - 1) * 10, pillar: { stem: STEMS[si], branch: BRANCHES[bi] } });
  }
  return result;
}

// ── 메인: 사주 계산 ──
export interface SajuPillars {
  year:    Pillar;
  month:   Pillar;
  day:     Pillar;
  hour:    Pillar | null; // 시간 모를 때 null
  sajuYear: number;
  termName: string; // 월 시작 절기명
  daeun:   Daeun[];
}

export function calcSaju(
  birthYear: number,
  birthMonth: number,  // 1-12
  birthDay: number,
  birthHour: number | null,  // 0-23, null = 모름
  sex: 'male' | 'female',
): SajuPillars {
  // KST Date (시간 없으면 정오로 처리)
  const kst = new Date(birthYear, birthMonth - 1, birthDay, birthHour ?? 12, 0, 0);

  // 월주·사주년
  const { branchIdx, termName, sajuYear } = getMonthTerm(kst);

  const yp = yearPillar(sajuYear);
  const mp = monthPillar(sajuYear, branchIdx);
  const dp = dayPillar(kst);
  const hp = birthHour !== null ? hourPillar(dp.stem, birthHour) : null;

  const daeun = calcDaeun(branchIdx, mp.stem, kst, yp.stem, sex);

  return { year: yp, month: mp, day: dp, hour: hp, sajuYear, termName, daeun };
}
