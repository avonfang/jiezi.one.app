import { Redis } from '@upstash/redis';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || '';

// GitHub Actions 构建时用 `vercel pull` 拉取环境变量，Vercel 的 Sensitive
// 变量只会返回 "[SENSITIVE]" 占位符，这里做防御性初始化：URL 非法时降级为
// null（构建不崩溃）；生产运行时由 Vercel 注入真实值，仍可正常连接 Upstash。
const kv: Redis | null = (() => {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  if (!/^https:\/\//i.test(UPSTASH_URL)) return null;
  try {
    return new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch {
    return null;
  }
})();

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

// ── Atomic credit operations ────────────────────────────────────────

const CREDIT_SCRIPT = `
local key = KEYS[1]
local amount = tonumber(ARGV[1])
local action = ARGV[2]
local data = redis.call('GET', key)
if action == 'use' then
  if not data then return tostring(-1) end
  local record = cjson.decode(data)
  if record.balance < amount then return tostring(-1) end
  record.balance = record.balance - amount
  redis.call('SET', key, cjson.encode(record))
  return tostring(record.balance)
elseif action == 'add' then
  if not data then
    record = {balance=amount, total_purchased=amount, created_at=tonumber(ARGV[3]) or 0}
    redis.call('SET', key, cjson.encode(record))
    return tostring(amount)
  end
  local record = cjson.decode(data)
  record.balance = record.balance + amount
  record.total_purchased = (record.total_purchased or 0) + amount
  redis.call('SET', key, cjson.encode(record))
  return tostring(record.balance)
end
return tostring(-2)
`;

export async function kvUseCredits(key: string, amount: number): Promise<number> {
  if (kv) {
    try {
      const result = await kv.eval(CREDIT_SCRIPT, [key], [String(amount), 'use']);
      return parseInt(String(result), 10);
    } catch {
      return -1;
    }
  }
  // In-memory: single-threaded, no race condition
  const data = mem.get(key);
  if (!data) return -1;
  const record = JSON.parse(data) as { balance: number };
  if (record.balance < amount) return -1;
  record.balance -= amount;
  mem.set(key, JSON.stringify(record));
  return record.balance;
}

export async function kvAddCredits(key: string, amount: number, createdAt?: number): Promise<number> {
  if (kv) {
    try {
      const result = await kv.eval(CREDIT_SCRIPT, [key], [String(amount), 'add', String(createdAt || Date.now())]);
      return parseInt(String(result), 10);
    } catch {
      return -1;
    }
  }
  const data = mem.get(key);
  if (!data) {
    const record = { balance: amount, total_purchased: amount, created_at: createdAt || Date.now() };
    mem.set(key, JSON.stringify(record));
    return amount;
  }
  const record = JSON.parse(data) as { balance: number; total_purchased?: number };
  record.balance += amount;
  record.total_purchased = (record.total_purchased || 0) + amount;
  mem.set(key, JSON.stringify(record));
  return record.balance;
}
