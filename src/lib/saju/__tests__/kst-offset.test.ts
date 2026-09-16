/**
 * 한국 표준시·서머타임 이력 — tzdata Asia/Seoul (zdump) 전환 인스턴트 기준 경계 테스트.
 */
import { describe, it, expect } from 'vitest';
import { kstOffsetAt, kstWallToUTC } from '../kst-offset';

const off = (y: number, m: number, d: number, h: number, mi = 0) => kstOffsetAt(y, m, d, h, mi).offsetSec;

describe('kstOffsetAt — 구간별 오프셋', () => {
  it('현대(1961-08-10 이후, 서머타임 제외) = +9', () => {
    expect(off(1990, 1, 1, 12)).toBe(32400);
    expect(off(2024, 7, 1, 0)).toBe(32400);
    expect(kstOffsetAt(2024, 7, 1, 0, 0).label).toBeNull();
  });

  it('1908 이전 = LMT +8:27:52', () => {
    expect(off(1900, 1, 1, 12)).toBe(30472);
    expect(off(1908, 3, 31, 23, 59)).toBe(30472);
  });

  it('1908-04-01 ~ 1911-12-31 = +8:30', () => {
    expect(off(1910, 6, 1, 12)).toBe(30600);
    expect(off(1912, 1, 1, 0, 30)).toBe(32400); // 전환 직후(00:30 새 시계)
  });

  it('1948~1951 여름 서머타임 = +10, 1952~53 은 없음', () => {
    expect(off(1948, 7, 1, 12)).toBe(36000);
    expect(off(1949, 7, 1, 12)).toBe(36000);
    expect(off(1950, 7, 1, 12)).toBe(36000);
    expect(off(1951, 7, 1, 12)).toBe(36000);
    expect(off(1952, 7, 1, 12)).toBe(32400);
    expect(off(1953, 7, 1, 12)).toBe(32400);
  });

  it('1954-03-21 ~ 1961-08-09 = +8:30 (여름 서머타임 +9:30)', () => {
    expect(off(1954, 3, 20, 23, 0)).toBe(32400);   // 전환 전
    expect(off(1954, 3, 21, 0, 0)).toBe(30600);    // 전환 후(23:30 으로 되돌아간 뒤)
    expect(off(1955, 6, 1, 12)).toBe(34200);       // 1955 서머타임
    expect(off(1955, 10, 1, 12)).toBe(30600);
    expect(off(1960, 7, 1, 12)).toBe(34200);
    expect(off(1961, 8, 9, 23, 0)).toBe(30600);
    expect(off(1961, 8, 10, 1, 0)).toBe(32400);
  });

  it('1987·1988 서머타임 = +10, 경계 시각', () => {
    expect(off(1987, 5, 10, 1, 59)).toBe(32400);
    expect(off(1987, 5, 10, 3, 0)).toBe(36000);   // 02:00→03:00 점프 직후
    expect(off(1987, 7, 15, 0, 30)).toBe(36000);
    expect(off(1987, 10, 11, 1, 59)).toBe(36000);
    expect(off(1987, 10, 11, 2, 0)).toBe(32400);  // 겹치는 시각은 표준시로
    expect(off(1988, 5, 8, 3, 0)).toBe(36000);
    expect(off(1988, 10, 9, 2, 0)).toBe(32400);
    expect(off(1986, 7, 15, 0, 30)).toBe(32400);  // 대조군
    expect(off(1989, 7, 15, 0, 30)).toBe(32400);
  });

  it('라벨은 +9 가 아닐 때만', () => {
    expect(kstOffsetAt(1987, 7, 15, 0, 30).label).toContain('서머타임');
    expect(kstOffsetAt(1958, 1, 15, 0, 30).label).toContain('UTC+8:30');
    expect(kstOffsetAt(1990, 7, 15, 0, 30).label).toBeNull();
  });
});

describe('kstWallToUTC', () => {
  it('1987-07-15 00:30 KDT → 1987-07-14T14:30Z', () => {
    expect(kstWallToUTC(1987, 7, 15, 0, 30).utc.toISOString()).toBe('1987-07-14T14:30:00.000Z');
  });
  it('1958-01-15 00:30 (+8:30) → 1958-01-14T16:00Z', () => {
    expect(kstWallToUTC(1958, 1, 15, 0, 30).utc.toISOString()).toBe('1958-01-14T16:00:00.000Z');
  });
  it('2000-01-01 09:00 KST → 2000-01-01T00:00Z', () => {
    expect(kstWallToUTC(2000, 1, 1, 9, 0).utc.toISOString()).toBe('2000-01-01T00:00:00.000Z');
  });
});
