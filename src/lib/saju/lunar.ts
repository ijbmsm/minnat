/**
 * 음력 → 양력 변환 유틸리티
 * korean-lunar-calendar 패키지 래퍼
 */
import KoreanLunarCalendar from 'korean-lunar-calendar';

export interface SolarDate {
  year:  number;
  month: number;
  day:   number;
}

/**
 * 음력 날짜 → 양력 날짜 변환
 * @param year        음력 연도
 * @param month       음력 월 (1-12)
 * @param day         음력 일
 * @param isLeapMonth 윤달 여부
 */
export function lunarToSolar(
  year: number,
  month: number,
  day: number,
  isLeapMonth = false,
): SolarDate {
  const cal = new KoreanLunarCalendar();
  const ok = cal.setLunarDate(year, month, day, isLeapMonth);
  if (!ok) throw new Error(`음력 날짜 변환 실패: ${year}년 ${month}월 ${day}일`);
  return cal.getSolarCalendar() as SolarDate;
}
