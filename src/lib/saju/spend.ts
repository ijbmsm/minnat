/**
 * 월 비용 킬스위치 (SAJU_PLAN_V2 P2-6) — 결제 수익이 0 이므로 지출 상한을 코드로 건다.
 * Redis `saju:spend:{YYYYMM}` 에 실제 LLM 호출 수만 누적. 캐시 히트·DB 폴백·미리보기는 세지 않는다.
 * Redis 미설정(로컬)이면 항상 허용.
 */
import { Redis } from '@upstash/redis';

// 월 지출 상한 $50 (결정 2026-09-16). Sonnet 5 회당 4~5센트(캐시 미적중·최대 토큰 가정) → 1,000회.
// 실측 후 회당 비용이 낮으면 올린다. 어드민 호출은 세지 않는다.
const DEFAULT_MONTHLY_CALL_LIMIT = 1000;

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
  const count = await r.incr(key);
  if (count === 1) await r.expire(key, 40 * 86400);
  const limit = monthlyCallLimit();
  if (count > limit) {
    await r.decr(key);
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
  await r.decr(spendKeyFor());
}
