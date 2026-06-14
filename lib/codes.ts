import { kvGet, kvSet } from './kv-store';
import { addCredits } from './credits';

const IDS_KEY = 'codes:ids';

interface ActivationCode {
  code: string;
  credits: number;
  plan: string;
  status: 'active' | 'redeemed';
  redeemed_by?: string;
  redeemed_at?: number;
  created_at: number;
}

function codeKey(str: string) {
  return `code:${str}`;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `JZ-${part()}-${part()}`;
}

export async function generateCodes(count: number, credits: number, plan: string): Promise<ActivationCode[]> {
  const codes: ActivationCode[] = [];
  for (let i = 0; i < count; i++) {
    const code: ActivationCode = {
      code: generateCode(),
      credits,
      plan,
      status: 'active',
      created_at: Date.now(),
    };
    await kvSet(codeKey(code.code), code);
    codes.push(code);
  }

  // Maintain code ID list
  const ids = await kvGet<string[]>(IDS_KEY) || [];
  for (const code of codes) {
    ids.unshift(code.code);
  }
  await kvSet(IDS_KEY, ids);

  return codes;
}

export async function listCodes(): Promise<ActivationCode[]> {
  const ids = await kvGet<string[]>(IDS_KEY) || [];
  const codes: ActivationCode[] = [];
  for (const id of ids) {
    const code = await kvGet<ActivationCode>(codeKey(id));
    if (code) codes.push(code);
  }
  return codes.sort((a, b) => b.created_at - a.created_at);
}

export async function redeemCode(codeStr: string, userId: string): Promise<{ ok: true; credits: number } | { ok: false; error: string }> {
  const normalized = codeStr.trim().toUpperCase();
  const code = await kvGet<ActivationCode>(codeKey(normalized));
  if (!code) {
    return { ok: false, error: '激活码不存在' };
  }
  if (code.status !== 'active') {
    return { ok: false, error: '该激活码已被使用' };
  }
  code.status = 'redeemed';
  code.redeemed_by = userId;
  code.redeemed_at = Date.now();
  await kvSet(codeKey(normalized), code);
  await addCredits(userId, code.credits);
  return { ok: true, credits: code.credits };
}
