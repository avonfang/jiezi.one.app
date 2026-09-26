import { kvRateLimit } from './kv-store';

export function getRequestIp(request: Request): string {
  const trusted = request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-real-ip');
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').pop();
  return (trusted || forwarded || 'unknown').trim();
}

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const count = await kvRateLimit(`ratelimit:${key}`, windowMs);
    return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
  } catch {
    // Costly operations must not become unlimited when storage is unavailable.
    return { allowed: false, remaining: 0 };
  }
}

export async function limitCostlyRequest(
  request: Request,
  route: string,
  userId: string | null,
  maxPerHour: number,
): Promise<Response | null> {
  const ip = getRequestIp(request);
  const userLimit = userId?.startsWith('anon_') ? Math.min(maxPerHour, 3) : maxPerHour;
  const checks = [
    checkRateLimit(`cost:${route}:ip:${ip}`, Math.min(maxPerHour * 3, 20), 3600000),
    checkRateLimit(`cost:${route}:user:${userId || ip}`, userLimit, 3600000),
  ];
  const results = await Promise.all(checks);
  return results.every(result => result.allowed)
    ? null
    : Response.json({ error: '请求过于频繁，请稍后重试' }, { status: 429 });
}
