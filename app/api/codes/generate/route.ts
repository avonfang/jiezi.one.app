import { NextRequest } from 'next/server';
import { generateCodes } from '@/lib/codes';

const PLANS: Record<string, { credits: number; label: string }> = {
  basic: { credits: 7, label: '体验装' },
  standard: { credits: 15, label: '标准装' },
  premium: { credits: 35, label: '畅享装' },
  topup_small: { credits: 3, label: '积分加油包(3积分)' },
  topup_large: { credits: 5, label: '积分加油包(5积分)' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, count } = body as { plan: string; count: number };
    const cfg = PLANS[plan];
    if (!cfg) return Response.json({ error: '无效的套餐' }, { status: 400 });
    const n = Math.min(Math.max(1, count || 1), 50);
    const codes = await generateCodes(n, cfg.credits, plan);
    return Response.json({ success: true, codes: codes.map(c => ({ code: c.code, credits: c.credits, plan: cfg.label })) });
  } catch {
    return Response.json({ error: '生成失败' }, { status: 500 });
  }
}
