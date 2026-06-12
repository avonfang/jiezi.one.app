import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const CREDITS_DIR = path.join(process.cwd(), '.credits');

function filePath(userId: string) {
  return path.join(CREDITS_DIR, `${userId}.json`);
}

interface CreditRecord {
  balance: number;
  total_purchased: number;
  created_at: number;
}

export async function initCredits(userId: string): Promise<void> {
  if (existsSync(filePath(userId))) return;
  await mkdir(CREDITS_DIR, { recursive: true });
  await writeFile(
    filePath(userId),
    JSON.stringify({ balance: 1, total_purchased: 0, created_at: Date.now() }),
    'utf-8'
  );
}

export async function getBalance(userId: string): Promise<number> {
  try {
    if (!existsSync(filePath(userId))) return 0;
    const raw = await readFile(filePath(userId), 'utf-8');
    const record: CreditRecord = JSON.parse(raw);
    return record.balance;
  } catch {
    return 0;
  }
}

export async function useCredit(userId: string): Promise<boolean> {
  try {
    if (!existsSync(filePath(userId))) return false;
    const raw = await readFile(filePath(userId), 'utf-8');
    const record: CreditRecord = JSON.parse(raw);
    if (record.balance < 1) return false;
    record.balance -= 1;
    await writeFile(filePath(userId), JSON.stringify(record), 'utf-8');
    return true;
  } catch {
    return false;
  }
}

export async function addCredits(userId: string, amount: number): Promise<number> {
  await mkdir(CREDITS_DIR, { recursive: true });
  const fp = filePath(userId);
  let record: CreditRecord;
  if (existsSync(fp)) {
    const raw = await readFile(fp, 'utf-8');
    record = JSON.parse(raw);
  } else {
    record = { balance: 0, total_purchased: 0, created_at: Date.now() };
  }
  record.balance += amount;
  record.total_purchased += amount;
  await writeFile(fp, JSON.stringify(record), 'utf-8');
  return record.balance;
}
