/**
 * 월 비용 킬스위치 (SAJU_PLAN_V2 P2-6) — 결제 수익이 0 이므로 지출 상한을 코드로 건다.
 * Redis `saju:spend:{YYYYMM}` 에 실제 LLM 호출 수만 누적. 캐시 히트·DB 폴백·미리보기는 세지 않는다.
 * Redis 미설정(로컬)이면 항상 허용.
 */
import { Redis } from '@upstash/redis';

// 월 LLM 호출 상한 3,000회 (결정 2026-09-17).
// 회당 비용은 타입에 따라 다르다 — 오늘의 사주 약 1.3센트(출력 900토큰),
// 종합·연애·직업 약 4센트(출력 3,500토큰), 궁합 약 3센트.
// 3,000회면 구성에 따라 대략 $40~120. 여기에 닿을 정도면 사업자·PG 를 검토할 시점이다.
// 어드민 호출은 세지도 막지도 않는다.
const DEFAULT_MONTHLY_CALL_LIMIT = 3000;

let _redis: Redis | null | undefined;
function redis(): Redis | null {
  if (_redis !== undefined) return _redis;
  _redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;
  return _redis;
}

export function monthlyCallLimit(): number {
  const raw = Number(process.env.SAJU_MONTHLY_CALL_LIMIT);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MONTHLY_CALL_LIMIT;
}

export function spendKeyFor(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return `saju:spend:${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, '0')}`;
}

export class MonthlyCapError extends Error {
  constructor(public readonly count: number, public readonly limit: number) {
    super('monthly_cap');
  }
}

/**
 * LLM 호출 직전에 부른다. 한도 초과면 MonthlyCapError.
 * 어드민은 세지도 막지도 않는다.
 */
export async function reserveLLMCall(userId: string | null): Promise<void> {
  if (userId && userId === process.env.SAJU_ADMIN_USER_ID) return;
  const r = redis();
  if (!r) return;
  const key = spendKeyFor();
  let count: number;
  try {
    count = await r.incr(key);
    if (count === 1) await r.expire(key, 40 * 86400);
  } catch (err) {
    // Redis 장애 시 통과시킨다 — 킬스위치는 2차 방어선이고, 1차는 계정당 하루 한 편이다.
    // 여기서 막으면 캐시 하나 죽었다고 서비스 전체가 멈춘다.
    console.warn('[saju spend] 카운터 실패 — 킬스위치 우회:', err instanceof Error ? err.message : err);
    return;
  }
  const limit = monthlyCallLimit();
  if (count > limit) {
    try { await r.decr(key); } catch { /* 무시 */ }
    throw new MonthlyCapError(count, limit);
  }
  if (count === Math.floor(limit * 0.8)) {
    console.warn(`[saju spend] 월 호출 한도 80% 도달 (${count}/${limit})`);
  }
}

/** 실패한 호출은 되돌린다 (LLM 예외 시). */
export async function releaseLLMCall(userId: string | null): Promise<void> {
  if (userId && userId === process.env.SAJU_ADMIN_USER_ID) return;
  const r = redis();
  if (!r) return;
  try { await r.decr(spendKeyFor()); } catch { /* 무시 */ }
}
