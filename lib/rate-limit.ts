import { kvGet, kvSet } from './kv-store';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemory = new Map<string, RateLimitEntry>();

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const redisKey = `ratelimit:${key}`;

  // If Upstash Redis is available (kv function exists), use Redis-based rate limiting
  const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
  const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';
  const useRedis = !!(UPSTASH_URL && UPSTASH_TOKEN);

  if (useRedis) {
    // Use Redis for atomic rate limiting
    try {
      const entry = await kvGet<RateLimitEntry>(redisKey);
      if (!entry || now > entry.resetAt) {
        await kvSet(redisKey, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1 };
      }
      if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0 };
      }
      entry.count += 1;
      await kvSet(redisKey, entry);
      return { allowed: true, remaining: maxRequests - entry.count };
    } catch {
      return { allowed: true, remaining: 1 };
    }
  }

  // In-memory fallback
  const entry = inMemory.get(key);
  if (!entry || now > entry.resetAt) {
    inMemory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}
