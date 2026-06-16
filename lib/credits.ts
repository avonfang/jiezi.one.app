import { kvGet, kvSet, kvUseCredits, kvAddCredits } from './kv-store';

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
  await kvSet(creditKey(userId), { balance: 100, total_purchased: 0, created_at: Date.now() });
}

export async function getBalance(userId: string): Promise<number> {
  const record = await kvGet<CreditRecord>(creditKey(userId));
  return record?.balance ?? 0;
}

export async function useCredit(userId: string): Promise<boolean> {
  return useCredits(userId, 1);
}

export async function useCredits(userId: string, amount: number): Promise<boolean> {
  const result = await kvUseCredits(creditKey(userId), amount);
  return result >= 0;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  const result = await kvAddCredits(creditKey(userId), amount);
  return result >= 0 ? result : 0;
}
