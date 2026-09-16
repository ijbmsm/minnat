/**
 * 한국 표준시·서머타임 이력 — 출생 당시 시계 시각(wall clock) → UTC 변환.
 *
 * 출처: tzdata `Asia/Seoul` (macOS `zdump -v -c 1880,1995 Asia/Seoul` 로 추출, 2026-09-16).
 *  · ~1908-04-01          LMT  UTC+8:27:52
 *  · 1908-04-01~1911-12-31 KST  UTC+8:30
 *  · 1912-01-01~1954-03-20 JST/KST UTC+9   (1948~1951 여름 서머타임 UTC+10)
 *  · 1954-03-21~1961-08-09 KST  UTC+8:30  (1955~1960 여름 서머타임 UTC+9:30)
 *  · 1961-08-10~           KST  UTC+9     (1987·1988 5~10월 서머타임 UTC+10)
 *
 * 시주는 2시간 단위라 30분~1시간 오차로 시주가 바뀌는 사람이 실제로 많다
 * (1987~88년 5~10월생, 1954~61년생). 호적·출생증명서의 시각은 당시 시계 시각이므로
 * 반드시 당시 오프셋으로 UTC 를 만들어야 진태양시가 맞는다.
 */

interface Transition {
  /** 이 인스턴트(UTC ms)부터 offsetSec 적용 */
  utc: number;
  offsetSec: number;
}

const T = (iso: string, offsetSec: number): Transition => ({ utc: Date.parse(iso), offsetSec });

/** 첫 전환 이전(1908-03-31 이전)의 오프셋 — LMT 8:27:52 */
const LMT_OFFSET_SEC = 30472;

/** zdump 순서 그대로. 라벨만 바뀐 1945-09-08 (JST→KST, 둘 다 +9) 은 제외. */
const TRANSITIONS: readonly Transition[] = [
  T('1908-03-31T15:32:08Z', 30600),
  T('1911-12-31T15:30:00Z', 32400),
  T('1948-05-31T15:00:00Z', 36000),
  T('1948-09-12T14:00:00Z', 32400),
  T('1949-04-02T15:00:00Z', 36000),
  T('1949-09-10T14:00:00Z', 32400),
  T('1950-03-31T15:00:00Z', 36000),
  T('1950-09-09T14:00:00Z', 32400),
  T('1951-05-05T15:00:00Z', 36000),
  T('1951-09-08T14:00:00Z', 32400),
  T('1954-03-20T15:00:00Z', 30600),
  T('1955-05-04T15:30:00Z', 34200),
  T('1955-09-08T14:30:00Z', 30600),
  T('1956-05-19T15:30:00Z', 34200),
  T('1956-09-29T14:30:00Z', 30600),
  T('1957-05-04T15:30:00Z', 34200),
  T('1957-09-21T14:30:00Z', 30600),
  T('1958-05-03T15:30:00Z', 34200),
  T('1958-09-20T14:30:00Z', 30600),
  T('1959-05-02T15:30:00Z', 34200),
  T('1959-09-19T14:30:00Z', 30600),
  T('1960-04-30T15:30:00Z', 34200),
  T('1960-09-17T14:30:00Z', 30600),
  T('1961-08-09T15:30:00Z', 32400),
  T('1987-05-09T17:00:00Z', 36000),
  T('1987-10-10T17:00:00Z', 32400),
  T('1988-05-07T17:00:00Z', 36000),
  T('1988-10-08T17:00:00Z', 32400),
] as const;

export const STANDARD_KST_OFFSET_SEC = 32400;

export interface KstOffset {
  /** UTC 대비 초 단위 오프셋 */
  offsetSec: number;
  /** 표준 KST(+9) 가 아닐 때만 사용자 안내용 라벨. +9 면 null. */
  label: string | null;
}

function labelFor(offsetSec: number): string | null {
  switch (offsetSec) {
    case STANDARD_KST_OFFSET_SEC: return null;
    case 30472: return '출생 당시 지방평균시(UTC+8:27:52) 적용';
    case 30600: return '출생 당시 표준시 UTC+8:30 적용';
    case 34200: return '출생 당시 서머타임(UTC+9:30) 적용';
    case 36000: return '출생 당시 서머타임(UTC+10) 적용';
    default:    return `출생 당시 표준시 UTC+${(offsetSec / 3600).toFixed(2)} 적용`;
  }
}

/**
 * 한국 시계 시각 → 당시 오프셋.
 * 규칙: 전환 목록을 순서대로 보며 "이 오프셋으로 해석한 wall 시각이 전환 인스턴트 이후"인
 * 마지막 전환의 오프셋을 채택한다. 서머타임 시작의 존재하지 않는 시각(02:00~03:00)은
 * 새 오프셋으로, 종료 시 겹치는 시각은 표준시로 해석된다.
 */
export function kstOffsetAt(
  year: number, month: number, day: number, hour: number, minute: number,
): KstOffset {
  const wallMs = Date.UTC(year, month - 1, day, hour, minute);
  let offsetSec = LMT_OFFSET_SEC;
  for (const t of TRANSITIONS) {
    if (wallMs - t.offsetSec * 1000 >= t.utc) offsetSec = t.offsetSec;
  }
  return { offsetSec, label: labelFor(offsetSec) };
}

/** 한국 시계 시각 → UTC Date. 오프셋 이력 반영. */
export function kstWallToUTC(
  year: number, month: number, day: number, hour: number, minute: number,
): { utc: Date; offset: KstOffset } {
  const offset = kstOffsetAt(year, month, day, hour, minute);
  const utc = new Date(Date.UTC(year, month - 1, day, hour, minute) - offset.offsetSec * 1000);
  return { utc, offset };
}
