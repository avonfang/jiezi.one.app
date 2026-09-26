import { kvGet, kvSet, kvUseCredits, kvUseCreditsOnce, kvAddCredits, kvTransferLegacyCredits } from './kv-store';

const LEGACY_ANON_CUTOFF = Date.parse('2026-09-28T00:00:00+08:00');

export async function transferLegacyAnonymousCredits(userId: string, anonymousId: unknown): Promise<number> {
  if (typeof anonymousId !== 'string' || anonymousId === userId) return 0;
  if (!/^(?:[a-f0-9-]{36}|wx_[A-Za-z0-9]{10,50})$/i.test(anonymousId)) return 0;
  await initCredits(userId);
  return kvTransferLegacyCredits(creditKey(anonymousId), creditKey(userId), LEGACY_ANON_CUTOFF);
}

function creditKey(userId: string) {
  return `credits:${userId}`;
}

interface CreditRecord {
  balance: number;
  total_purchased: number;
  created_at: number;
}

export async function initCredits(userId: string): Promise<void> {
  const existing = await kvGet<CreditRecord>(creditKey(userId));
  if (existing) return;
  await kvSet(creditKey(userId), { balance: 50, total_purchased: 0, created_at: Date.now() });
}

export async function getBalance(userId: string): Promise<number> {
  const record = await kvGet<CreditRecord>(creditKey(userId));
  return record?.balance ?? 0;
}

export async function spendCredit(userId: string): Promise<boolean> {
  return spendCredits(userId, 1);
}

export async function spendCredits(userId: string, amount: number): Promise<boolean> {
  const result = await kvUseCredits(creditKey(userId), amount);
  return result >= 0;
}

/**
 * 原子扣减一次积分，并写入一次性权益 key。
 * 重复请求同一 entitlementKey 不会重复扣费。
 */
export async function spendCreditsOnce(
  userId: string,
  amount: number,
  entitlementKey: string,
): Promise<number> {
  return kvUseCreditsOnce(creditKey(userId), entitlementKey, amount);
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const result = await kvAddCredits(creditKey(userId), amount);
  return result >= 0 ? result : 0;
}
