/**
 * seolgi.json 로더 + 인덱스
 *
 * seolgi.json은 Skyfield 배치(scripts/solar_terms_batch.py)로 생성한
 * 1880–2100년 절기 테이블. /public에 정적 파일로 배포.
 *
 * 런타임에서는 두 종류의 lookup만 필요:
 *   1. latestIpchunBefore(utc)  → 연주 기준 사주 연도
 *   2. latestJieBefore(utc)     → 월주 기준 月支
 */

export interface SeolgiRow {
  term_index: number;
  name_ko: string;
  name_zh: string;
  longitude_deg: number;
  instant_utc: string;       // ISO8601 UTC
  instant_kst: string;       // ISO8601 +09:00
  is_month_boundary: boolean;
  month_branch: number | null; // 月支 index (子=0..亥=11), 中氣면 null
  boundary_caution: boolean;
}

export interface SeolgiIndex {
  /** 입춘(term_index=21)만 연도별 정렬 */
  ipchun: SeolgiRow[];
  /** 節(is_month_boundary=true)만 시간순 정렬 */
  jie: SeolgiRow[];
  /** 전체 시간순 */
  all: SeolgiRow[];
}

/** raw JSON → 인덱스 빌드. Next.js 서버에서 1회 호출 후 모듈 캐시에 유지. */
export function buildSeolgiIndex(rows: SeolgiRow[]): SeolgiIndex {
  const sorted = [...rows].sort((a, b) => a.instant_utc.localeCompare(b.instant_utc));
  return {
    all:    sorted,
    ipchun: sorted.filter(r => r.term_index === 21),
    jie:    sorted.filter(r => r.is_month_boundary),
  };
}

/** utc 이전 마지막 입춘 → 사주 연도 */
export function latestIpchunBefore(index: SeolgiIndex, utc: Date): SeolgiRow {
  const ts = utc.toISOString();
  // ipchun는 시간순 정렬 — 이진탐색으로 O(log n)
  const arr = index.ipchun;
  let lo = 0, hi = arr.length - 1, best = arr[0];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].instant_utc <= ts) { best = arr[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

/** utc 이전 마지막 節 → 月支 */
export function latestJieBefore(index: SeolgiIndex, utc: Date): SeolgiRow {
  const ts = utc.toISOString();
  const arr = index.jie;
  let lo = 0, hi = arr.length - 1, best = arr[0];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].instant_utc <= ts) { best = arr[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return best;
}

/** utc 이후 첫 번째 節 (대운 순행 계산용) */
export function nextJieAfter(index: SeolgiIndex, utc: Date): SeolgiRow {
  const ts = utc.toISOString();
  return index.jie.find(r => r.instant_utc > ts) ?? index.jie[index.jie.length - 1];
}

/** utc 이전 두 번째 節 (대운 역행 계산용: 직전 節) */
export function prevJieBefore(index: SeolgiIndex, utc: Date): SeolgiRow {
  const ts = utc.toISOString();
  const arr = index.jie;
  let lo = 0, hi = arr.length - 1;
  let first: SeolgiRow | null = null, second: SeolgiRow | null = null;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid].instant_utc < ts) { second = first; first = arr[mid]; lo = mid + 1; }
    else hi = mid - 1;
  }
  return second ?? arr[0];
}
