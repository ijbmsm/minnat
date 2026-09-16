/**
 * 사주 풀이 캐시 — Upstash Redis 래퍼. 서버 전용.
 *
 * 캐시는 "있으면 좋은 것" 이지 서비스의 전제가 아니다. Upstash 가 죽거나(무료 플랜은
 * 미사용 DB 를 삭제한다) 환경변수가 비어도 풀이는 계속 나와야 한다.
 * 그래서 모든 호출을 삼켜서 null 로 돌린다. 실패는 로그로만 남긴다.
 */
import { Redis } from '@upstash/redis';

let _redis: Redis | null | undefined;
function client(): Redis | null {
  if (_redis !== undefined) return _redis;
  _redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
    : null;
  if (!_redis) console.warn('[saju cache] UPSTASH 환경변수 없음 — 캐시 없이 동작');
  return _redis;
}

/** Redis 가 살아 있는지와 무관하게 절대 throw 하지 않는다. */
export function cacheEnabled(): boolean {
  return client() !== null;
}

function warn(op: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`[saju cache] ${op} 실패 — 캐시 없이 진행: ${msg}`);
}

export async function cacheGet(key: string): Promise<string | null> {
  const r = client();
  if (!r) return null;
  try { return await r.get<string>(key); }
  catch (err) { warn(`get ${key}`, err); return null; }
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  const r = client();
  if (!r) return;
  try {
    if (ttlSeconds) await r.set(key, value, { ex: ttlSeconds });
    else await r.set(key, value);
  } catch (err) { warn(`set ${key}`, err); }
}

export async function cacheDel(key: string): Promise<void> {
  const r = client();
  if (!r) return;
  try { await r.del(key); }
  catch (err) { warn(`del ${key}`, err); }
}

/** 레이트리밋도 캐시가 없으면 통과시킨다 (대신 로그인·크레딧이 남용을 막는다). */
export async function rateLimitOk(key: string, limit: number, windowSec: number): Promise<boolean> {
  const r = client();
  if (!r) return true;
  try {
    const n = await r.incr(key);
    if (n === 1) await r.expire(key, windowSec);
    return n <= limit;
  } catch (err) { warn(`ratelimit ${key}`, err); return true; }
}
