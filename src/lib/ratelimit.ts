import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

function createLimiter(prefix: string, requests: number, window: string) {
  const redis = getRedis();
  if (!redis) return null;

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
    prefix: `rl:${prefix}`,
  });
}

export const postLimiter = createLimiter("post", 5, "10 m");
export const likeLimiter = createLimiter("like", 30, "1 m");
export const reportLimiter = createLimiter("report", 3, "10 m");

export async function checkRateLimit(
  limiter: Ratelimit | null,
  key: string
): Promise<{ allowed: boolean; remaining?: number }> {
  if (!limiter) return { allowed: true };

  const { success, remaining } = await limiter.limit(key);
  return { allowed: success, remaining };
}
