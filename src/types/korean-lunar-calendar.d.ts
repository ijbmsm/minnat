declare module 'korean-lunar-calendar' {
  class KoreanLunarCalendar {
    setLunarDate(year: number, month: number, day: number, isLeapMonth: boolean): boolean;
    getSolarCalendar(): { year: number; month: number; day: number };
  }
  export = KoreanLunarCalendar;
}
