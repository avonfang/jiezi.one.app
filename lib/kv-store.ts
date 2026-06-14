import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

const kv = (UPSTASH_URL && UPSTASH_TOKEN)
  ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN })
  : null;

const mem = new Map<string, string>();

export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  if (kv) {
    try { return await kv.get<T>(key); } catch { return null; }
  }
  const val = mem.get(key);
  return val ? JSON.parse(val) as T : null;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  if (kv) {
    await kv.set(key, value);
  } else {
    mem.set(key, JSON.stringify(value));
  }
}

export async function kvDel(key: string): Promise<void> {
  if (kv) {
    await kv.del(key);
  } else {
    mem.delete(key);
  }
}

export async function kvKeys(pattern?: string): Promise<string[]> {
  if (kv) {
    return kv.keys(pattern || '*');
  }
  const prefix = pattern ? pattern.replace('*', '') : '';
  return Array.from(mem.keys()).filter(k => k.startsWith(prefix));
}
