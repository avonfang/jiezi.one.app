import { kvGet, kvSet } from './kv-store';

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
  await kvSet(creditKey(userId), { balance: 3, total_purchased: 0, created_at: Date.now() });
}

export async function getBalance(userId: string): Promise<number> {
  const record = await kvGet<CreditRecord>(creditKey(userId));
  return record?.balance ?? 0;
}

export async function useCredit(userId: string): Promise<boolean> {
  return useCredits(userId, 1);
}

export async function useCredits(userId: string, amount: number): Promise<boolean> {
  const record = await kvGet<CreditRecord>(creditKey(userId));
  if (!record || record.balance < amount) return false;
  record.balance -= amount;
  await kvSet(creditKey(userId), record);
  return true;
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  let record = await kvGet<CreditRecord>(creditKey(userId));
  if (!record) {
    record = { balance: 0, total_purchased: 0, created_at: Date.now() };
  }
  record.balance += amount;
  record.total_purchased += amount;
  await kvSet(creditKey(userId), record);
  return record.balance;
}
