/**
 * 사주 명식 룰엔진 v2 — 순수 함수, 천문 의존성 0.
 *
 * 설계 원칙:
 *  · 연·월주: UTC 절기 인스턴트로 판정 (진태양시 보정 적용 X — 흔한 버그 방지)
 *  · 일·시주: 출생지 진태양시(경도+균시차 보정)로 판정
 *  · 일주 기준점: 1999-04-04 = 丙戌(gz=22), offset=49 (복수 플랫폼 교차검증)
 *  · 출력에 계산 트레이스 포함 → 재현 가능
 */

import type { SeolgiIndex } from './seolgi-loader';
import { latestIpchunBefore, latestJieBefore, nextJieAfter, prevJieBefore } from './seolgi-loader';
import { toApparentSolarMinutes, apparentMinutesToTime, dayOfYear } from './eot';
import { STEMS, BRANCHES, type Stem, type Branch } from './constants';

/* ── 상수 ── */

// 오호둔(五虎遁): 연간 index % 5 → 寅月 천간 index
// 甲己→丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
const TIGER_MONTH_STEM = [2, 4, 6, 8, 0] as const;

// 오서둔(五鼠遁): 일간 index % 5 → 子時 천간 index
// 甲己→甲(0), 乙庚→丙(2), 丙辛→戊(4), 丁壬→庚(6), 戊癸→壬(8)
const RAT_HOUR_STEM = [0, 2, 4, 6, 8] as const;

// 일주 60갑자 offset — 1999-04-04 = 丙戌(gz=22), 2024-01-01 = 甲子(gz=0), 복수 플랫폼 교차검증
const DAY_PILLAR_OFFSET = 49;

/* ── 타입 ── */

export interface Pillar {
  stem:   Stem;
  branch: Branch;
  gz:     number;  // 0-59 육십갑자 인덱스
}

export type DayBoundaryRule = 'midnight' | 'zi_hour';

export interface BirthInput {
  /** UTC 인스턴트 (연·월주 판정 기준) */
  birthUTC: Date;
  /** 출생지 진태양시 날짜 (일주 경계 판정). eot.ts로 계산해서 주입. */
  solarDate: { year: number; month: number; day: number };
  /** 진태양시 시각 (null = 시간 미상) */
  solarTime: { hour: number; minute: number } | null;
  /** 일주 경계 규칙 (기본: midnight) */
  dayBoundaryRule?: DayBoundaryRule;
}

export interface Daeun {
  startAge:    number;  // 교운나이 (반올림, 학파 기본값)
  /** 표시용 세: floor(exactYears). startAge와 기준 다름 — "5세 10개월" 표기에 사용 */
  startDisplayYear:  number;
  /** 표시용 월: 0~11. startDisplayYear 기준 나머지 개월 수 */
  startMonths: number;
  startYear:   number;
  pillar:      Pillar;
}

export interface FourPillars {
  year:  Pillar;
  month: Pillar;
  day:   Pillar;
  hour:  Pillar | null;
  daeun: Daeun[];
  trace: CalcTrace;
}

export interface CalcTrace {
  sajuYear:        number;
  ipchunUTC:       string;
  monthTermName:   string;
  jieUTC:          string;
  /** 출생 UTC 인스턴트 (ISO 문자열) — daysFromJie 계산의 canonical 소스 */
  birthUTC:        string;
  dayBoundaryRule: DayBoundaryRule;
  dayRolled:       boolean;
  effectiveSolarDate: { year: number; month: number; day: number };
  dayPillarOffset: number;
  boundaryCaution: boolean;
  timeKnown:       boolean;
}

/* ── 내부 헬퍼 ── */

const mod = (n: number, m: number) => ((n % m) + m) % m;

/** 그레고리력 → 율리우스적일(JDN). Fliegel–Van Flandern 공식. */
function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5)
       + 365 * yy + Math.floor(yy / 4)
       - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function makePillar(gz: number): Pillar {
  const g = mod(gz, 60);
  return { stem: STEMS[g % 10], branch: BRANCHES[g % 12], gz: g };
}

/* ── 4주 계산 ── */

function calcYear(index: SeolgiIndex, birthUTC: Date): { pillar: Pillar; sajuYear: number; ipchunUTC: string } {
  const ipchun = latestIpchunBefore(index, birthUTC);
  const Y = new Date(ipchun.instant_utc).getUTCFullYear();
  return { pillar: makePillar(mod(Y - 4, 60)), sajuYear: Y, ipchunUTC: ipchun.instant_utc };
}

function calcMonth(index: SeolgiIndex, birthUTC: Date, yearStemIdx: number): { pillar: Pillar; termName: string; jieUTC: string } {
  const jie = latestJieBefore(index, birthUTC);
  const branch = jie.month_branch!;
  const yinStem = TIGER_MONTH_STEM[yearStemIdx % 5];
  const monthOrder = mod(branch - 2, 12); // 寅(2)을 0번째로
  const stem = mod(yinStem + monthOrder, 10);
  return {
    pillar:   { stem: STEMS[stem], branch: BRANCHES[branch], gz: mod(stem * 6 - branch * 5, 60) },
    termName: jie.name_ko,
    jieUTC:   jie.instant_utc,
  };
}

function calcDay(input: BirthInput): { pillar: Pillar; effectiveDate: { year: number; month: number; day: number }; rolled: boolean } {
  const rule = input.dayBoundaryRule ?? 'midnight';
  let { year, month, day } = input.solarDate;
  let rolled = false;

  // 子시설: 진태양시 23:00 이후(야자시)만 익일로 전환.
  // 조자시(00:00~00:59)는 당일 유지 — dayOffset이 이미 +1이면 solarTime.hour는 0~1대이므로 여기서 재전환 안 함.
  if (rule === 'zi_hour' && input.solarTime && input.solarTime.hour >= 23) {
    const d = new Date(Date.UTC(year, month - 1, day + 1));
    year = d.getUTCFullYear(); month = d.getUTCMonth() + 1; day = d.getUTCDate();
    rolled = true;
  }

  const jdn = toJDN(year, month, day);
  return {
    pillar: makePillar(jdn + DAY_PILLAR_OFFSET),
    effectiveDate: { year, month, day },
    rolled,
  };
}

function calcHour(solarTime: { hour: number; minute: number } | null, dayStemIdx: number): Pillar | null {
  if (!solarTime) return null;
  const totalMin = solarTime.hour * 60 + solarTime.minute;
  const branch = mod(Math.floor((totalMin + 60) / 120), 12); // 23:00 → 子(0)
  const ziStem = RAT_HOUR_STEM[dayStemIdx % 5];
  const stem   = mod(ziStem + branch, 10);
  return { stem: STEMS[stem], branch: BRANCHES[branch], gz: mod(stem * 6 - branch * 5, 60) };
}

/* ── 대운 계산 ── */

function calcDaeun(
  index: SeolgiIndex,
  birthUTC: Date,
  sajuYear: number,
  yearStemIdx: number,
  monthPillar: Pillar,
  sex: 'male' | 'female',
): Daeun[] {
  const yearYang = yearStemIdx % 2 === 0; // 갑=0(양), 을=1(음)...
  const forward  = (sex === 'male' && yearYang) || (sex === 'female' && !yearYang);

  // 대운 시작 나이 = 절기까지 일수 ÷ 3
  // 소수 부분 → 월로 변환해 "N년 M개월" 표기 가능하게 저장
  // 라운딩 규약: 자평 기본값 Math.round (학파별로 ceil/floor 사용 가능)
  const nextJie = nextJieAfter(index, birthUTC);
  const prevJie = prevJieBefore(index, birthUTC);
  const refUTC    = forward ? new Date(nextJie.instant_utc) : new Date(prevJie.instant_utc);
  const days      = Math.abs(refUTC.getTime() - birthUTC.getTime()) / 86_400_000;
  const exactYears  = days / 3;
  // 교운나이: 사주 관습상 반올림 (학파별 ceil/floor 변형은 SchoolProfile.daeunRounding 참조)
  const startAge    = Math.round(exactYears);
  // 표시용 세/월: floor 기준 분리 (startAge와 기준점 다름 주의)
  // "5세 10개월"처럼 표기 — 12개월 월이 생기면 +1년 0개월로 올림
  let displayYear   = Math.floor(exactYears);
  let startMonths   = Math.round((exactYears - displayYear) * 12);
  if (startMonths === 12) { displayYear += 1; startMonths = 0; }

  const mStemIdx   = STEMS.indexOf(monthPillar.stem);
  const mBranchIdx = BRANCHES.indexOf(monthPillar.branch);

  const result: Daeun[] = [];
  for (let n = 1; n <= 8; n++) {
    const step = forward ? n : -n;
    const stem   = STEMS[mod(mStemIdx + step, 10)];
    const branch = BRANCHES[mod(mBranchIdx + step, 12)];
    const stemI = STEMS.indexOf(stem);
    const branchI = BRANCHES.indexOf(branch);
    result.push({
      startAge:         startAge + (n - 1) * 10,
      startDisplayYear: n === 1 ? displayYear : startAge + (n - 1) * 10,
      startMonths:      n === 1 ? startMonths : 0,
      startYear:        sajuYear + startAge + (n - 1) * 10,
      pillar:           { stem, branch, gz: mod(stemI * 6 - branchI * 5, 60) },
    });
  }
  return result;
}

/* ── 진입점 ── */

/**
 * 사주 4주 + 대운 계산.
 *
 * @param index  seolgi-loader로 빌드한 절기 인덱스 (서버에서 1회 생성 후 재사용)
 * @param birth  출생 정보 (UTC 인스턴트 + 진태양시 날짜/시각)
 * @param sex    성별 (대운 방향 결정)
 */
export function computeFourPillars(
  index: SeolgiIndex,
  birth: BirthInput,
  sex: 'male' | 'female',
): FourPillars {
  const { pillar: yp, sajuYear, ipchunUTC } = calcYear(index, birth.birthUTC);
  const { pillar: mp, termName, jieUTC }    = calcMonth(index, birth.birthUTC, STEMS.indexOf(yp.stem));
  const { pillar: dp, effectiveDate, rolled } = calcDay(birth);
  const hp  = calcHour(birth.solarTime, STEMS.indexOf(dp.stem));

  const latestJie = latestJieBefore(index, birth.birthUTC);

  const daeun = calcDaeun(
    index, birth.birthUTC, sajuYear,
    STEMS.indexOf(yp.stem), mp, sex,
  );

  return {
    year: yp, month: mp, day: dp, hour: hp,
    daeun,
    trace: {
      sajuYear,
      ipchunUTC,
      monthTermName:   termName,
      jieUTC,
      birthUTC:        birth.birthUTC.toISOString(),
      dayBoundaryRule: birth.dayBoundaryRule ?? 'midnight',
      dayRolled:       rolled,
      effectiveSolarDate: effectiveDate,
      dayPillarOffset: DAY_PILLAR_OFFSET,
      boundaryCaution: latestJie.boundary_caution,
      timeKnown:       !!birth.solarTime,
    },
  };
}

/* ── 편의 함수: 로컬 KST 입력 → BirthInput 변환 ── */

/**
 * KST 생년월일시 + 출생지 경도 → BirthInput.
 * 대부분의 한국 사주 사용 케이스에 적합.
 *
 * @param kstYear   KST 연도
 * @param kstMonth  KST 월 (1-12)
 * @param kstDay    KST 일
 * @param kstHour   KST 시 (0-23), null = 시간 미상
 * @param kstMinute KST 분 (기본 0)
 * @param longitudeE 출생지 경도 (기본 서울 127.0)
 */
export function fromKST(
  kstYear: number,
  kstMonth: number,
  kstDay: number,
  kstHour: number | null,
  kstMinute = 0,
  longitudeE = 127.0,
  dayBoundaryRule: DayBoundaryRule = 'midnight',
): BirthInput {
  // KST → UTC (KST = UTC+9)
  const birthUTC = new Date(Date.UTC(kstYear, kstMonth - 1, kstDay,
    (kstHour ?? 12) - 9, kstMinute));

  if (kstHour === null) {
    return {
      birthUTC,
      solarDate: { year: kstYear, month: kstMonth, day: kstDay },
      solarTime: null,
    };
  }

  // 진태양시 계산 — Spencer 균시차는 UTC 날짜 기준으로 계산해야 개념 일치
  const doy = dayOfYear(birthUTC.getUTCFullYear(), birthUTC.getUTCMonth() + 1, birthUTC.getUTCDate());
  // UTC 기준으로 진태양시 계산
  const utcH = birthUTC.getUTCHours();
  const utcM = birthUTC.getUTCMinutes();
  const apparentMin = toApparentSolarMinutes(utcH, utcM, longitudeE, doy);
  const { hour, minute, dayOffset } = apparentMinutesToTime(apparentMin);

  // 날짜 보정 (진태양시가 자정을 넘는 경우)
  // UTC 날짜 기준으로 dayOffset 적용해야 함:
  // KST 00:00~08:59 출생자는 UTC 전날이므로 kstDay 기준으로 더하면 하루 늦어짐
  const adjustedDate = new Date(Date.UTC(
    birthUTC.getUTCFullYear(),
    birthUTC.getUTCMonth(),
    birthUTC.getUTCDate() + dayOffset,
  ));

  return {
    birthUTC,
    solarDate: {
      year:  adjustedDate.getUTCFullYear(),
      month: adjustedDate.getUTCMonth() + 1,
      day:   adjustedDate.getUTCDate(),
    },
    solarTime: { hour, minute },
    dayBoundaryRule,
  };
}
