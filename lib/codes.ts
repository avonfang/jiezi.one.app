import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { addCredits } from './credits';

const CODES_DIR = path.join(process.cwd(), '.codes');

interface ActivationCode {
  code: string;
  credits: number;
  plan: string;
  status: 'active' | 'redeemed';
  redeemed_by?: string;
  redeemed_at?: number;
  created_at: number;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `JZ-${part()}-${part()}`;
}

export async function generateCodes(count: number, credits: number, plan: string): Promise<ActivationCode[]> {
  await mkdir(CODES_DIR, { recursive: true });
  const codes: ActivationCode[] = [];
  for (let i = 0; i < count; i++) {
    const code: ActivationCode = {
      code: generateCode(),
      credits,
      plan,
      status: 'active',
      created_at: Date.now(),
    };
    await writeFile(path.join(CODES_DIR, `${code.code}.json`), JSON.stringify(code), 'utf-8');
    codes.push(code);
  }
  return codes;
}

export async function listCodes(): Promise<ActivationCode[]> {
  if (!existsSync(CODES_DIR)) return [];
  const files = await readdir(CODES_DIR);
  const codes: ActivationCode[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(path.join(CODES_DIR, file), 'utf-8');
      codes.push(JSON.parse(raw));
    } catch { /* skip */ }
  }
  return codes.sort((a, b) => b.created_at - a.created_at);
}

export async function redeemCode(codeStr: string, userId: string): Promise<{ ok: true; credits: number } | { ok: false; error: string }> {
  const normalized = codeStr.trim().toUpperCase();
  const filePath = path.join(CODES_DIR, `${normalized}.json`);
  if (!existsSync(filePath)) {
    return { ok: false, error: '激活码不存在' };
  }
  const raw = await readFile(filePath, 'utf-8');
  const code: ActivationCode = JSON.parse(raw);
  if (code.status !== 'active') {
    return { ok: false, error: '该激活码已被使用' };
  }
  code.status = 'redeemed';
  code.redeemed_by = userId;
  code.redeemed_at = Date.now();
  await writeFile(filePath, JSON.stringify(code), 'utf-8');
  await addCredits(userId, code.credits);
  return { ok: true, credits: code.credits };
}
