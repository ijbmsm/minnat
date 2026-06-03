/**
 * 균시차(Equation of Time) 유틸리티
 *
 * 진태양시 = 평균태양시 + 균시차
 * 평균태양시 = UTC + 경도(°E) / 15 × 60 (분)
 * 범위: 연중 약 -16분 ~ +14분
 *
 * 일·시주 경계 판정에만 사용. 연·월주는 UTC 절기 인스턴트로 직접 비교.
 */

/** 연중 일수(1-based) → 균시차(분). Spencer 근사식, 정확도 ±30초. */
export function equationOfTimeMinutes(dayOfYear: number): number {
  const B = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}

/** 날짜에서 연중 일수 계산 (1월 1일 = 1) */
export function dayOfYear(year: number, month: number, day: number): number {
  const start = new Date(year, 0, 1);
  const target = new Date(year, month - 1, day);
  return Math.floor((target.getTime() - start.getTime()) / 86_400_000) + 1;
}

/**
 * UTC 시각 + 출생지 경도 → 진태양시 (분, 자정=0 기준)
 *
 * @param utcHour   UTC 시 (0-23)
 * @param utcMinute UTC 분 (0-59)
 * @param longitudeE 경도 (동경 양수, 서경 음수). 서울=127.0
 * @param doy       연중 일수 (dayOfYear 함수로 계산)
 * @returns 진태양시 분 (음수 가능 — 전날 23시대, 1440+ 가능 — 익일)
 */
export function toApparentSolarMinutes(
  utcHour: number,
  utcMinute: number,
  longitudeE: number,
  doy: number,
): number {
  const utcMinutes = utcHour * 60 + utcMinute;
  const longitudeOffset = longitudeE * 4;          // 1°E = +4분
  const eot = equationOfTimeMinutes(doy);
  return utcMinutes + longitudeOffset + eot;
}

/**
 * 진태양시 분 → { hour, minute, dayOffset }
 * dayOffset: -1=전날, 0=당일, +1=익일
 */
export function apparentMinutesToTime(totalMinutes: number): {
  hour: number;
  minute: number;
  dayOffset: number;
} {
  let dayOffset = 0;
  let m = totalMinutes;
  if (m < 0)    { m += 1440; dayOffset = -1; }
  if (m >= 1440){ m -= 1440; dayOffset =  1; }
  return { hour: Math.floor(m / 60), minute: Math.floor(m % 60), dayOffset };
}
