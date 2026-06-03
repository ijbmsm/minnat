// 태양 황경 계산 → 절기 날짜 산출 (Jean Meeus 근사 알고리즘)

const D2R = Math.PI / 180;

function jdToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;
  let a = z;
  if (z >= 2299161) {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }
  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);
  const day   = b - d - Math.floor(30.6001 * e);
  const month = e < 14 ? e - 1 : e - 13;
  const year  = month > 2 ? c - 4716 : c - 4715;
  const hrs   = f * 24;
  const h     = Math.floor(hrs);
  const m     = Math.floor((hrs - h) * 60);
  return new Date(Date.UTC(year, month - 1, day, h, m));
}

function solarLongitude(jd: number): number {
  const T  = (jd - 2451545.0) / 36525;
  const L0 = ((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360 + 360) % 360;
  let   M  = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360 + 360) % 360;
  const Mr = M * D2R;
  const C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           +  0.000289 * Math.sin(3 * Mr);
  const theta = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = theta - 0.00569 - 0.00478 * Math.sin(omega * D2R);
  return ((lambda % 360) + 360) % 360;
}

// 태양 황경이 target이 되는 Julian Day를 뉴턴법으로 탐색
function findTermJD(year: number, target: number): number {
  // 춘분점(λ=0°) 근사 JD
  const veJD = 2451623.80984 + 365.24219879 * (year - 2000);
  let jd = veJD + ((target + 360) % 360) / 360 * 365.25;
  for (let i = 0; i < 50; i++) {
    let diff = target - solarLongitude(jd);
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    if (Math.abs(diff) < 1e-5) break;
    jd += diff / 360 * 365.25;
  }
  return jd;
}

// 12 월절 (태양 황경 → 월지 인덱스)
// branchIdx: 자=0, 축=1, 인=2, 묘=3, 진=4, 사=5, 오=6, 미=7, 신=8, 유=9, 술=10, 해=11
export const MONTH_TERMS = [
  { name: '입춘', lon: 315, branchIdx: 2  },
  { name: '경칩', lon: 345, branchIdx: 3  },
  { name: '청명', lon:  15, branchIdx: 4  },
  { name: '입하', lon:  45, branchIdx: 5  },
  { name: '망종', lon:  75, branchIdx: 6  },
  { name: '소서', lon: 105, branchIdx: 7  },
  { name: '입추', lon: 135, branchIdx: 8  },
  { name: '백로', lon: 165, branchIdx: 9  },
  { name: '한로', lon: 195, branchIdx: 10 },
  { name: '입동', lon: 225, branchIdx: 11 },
  { name: '대설', lon: 255, branchIdx: 0  },
  { name: '소한', lon: 285, branchIdx: 1  },
] as const;

// KST(UTC+9) 기준 절기 날짜 캐시
const cache = new Map<string, Date>();

export function getSolarTermKST(calYear: number, termIdx: number): Date {
  const key = `${calYear}-${termIdx}`;
  if (cache.has(key)) return cache.get(key)!;
  const jd = findTermJD(calYear, MONTH_TERMS[termIdx].lon);
  const kst = new Date(jdToDate(jd).getTime() + 9 * 3600_000);
  cache.set(key, kst);
  return kst;
}

// 입춘 날짜 (KST)
export function getIpchunKST(calYear: number): Date {
  return getSolarTermKST(calYear, 0); // 입춘 = index 0
}

// 주어진 KST 날짜가 속하는 절기 월 반환
export function getMonthTerm(kst: Date): { termName: string; branchIdx: number; sajuYear: number } {
  const year = kst.getFullYear();
  const ts   = kst.getTime();

  // 전년·당년·익년 36개 절기 수집
  const all: Array<{ termName: string; branchIdx: number; time: number }> = [];
  for (const y of [year - 1, year, year + 1]) {
    for (let i = 0; i < MONTH_TERMS.length; i++) {
      all.push({
        termName:  MONTH_TERMS[i].name,
        branchIdx: MONTH_TERMS[i].branchIdx,
        time:      getSolarTermKST(y, i).getTime(),
      });
    }
  }
  all.sort((a, b) => a.time - b.time);

  // 생일 이전 마지막 절기
  let cur = all[0];
  for (const t of all) {
    if (t.time <= ts) cur = t;
    else break;
  }

  // 사주 년도: 입춘 이전이면 전년
  const ipchun = getSolarTermKST(year, 0).getTime();
  const sajuYear = ts >= ipchun ? year : year - 1;

  return { termName: cur.termName, branchIdx: cur.branchIdx, sajuYear };
}

// 다음 절기까지의 일수 (대운 계산용)
export function daysToNextTerm(kst: Date): number {
  const year = kst.getFullYear();
  const ts   = kst.getTime();
  const all: number[] = [];
  for (const y of [year, year + 1]) {
    for (let i = 0; i < MONTH_TERMS.length; i++) {
      const t = getSolarTermKST(y, i).getTime();
      if (t > ts) all.push(t);
    }
  }
  all.sort((a, b) => a - b);
  return (all[0] - ts) / 86_400_000;
}

// 이전 절기까지의 일수 (대운 계산용, 역행)
export function daysToPrevTerm(kst: Date): number {
  const year = kst.getFullYear();
  const ts   = kst.getTime();
  const all: number[] = [];
  for (const y of [year - 1, year]) {
    for (let i = 0; i < MONTH_TERMS.length; i++) {
      const t = getSolarTermKST(y, i).getTime();
      if (t < ts) all.push(t);
    }
  }
  all.sort((a, b) => b - a);
  return (ts - all[0]) / 86_400_000;
}
