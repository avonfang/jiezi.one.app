import { NextRequest } from 'next/server';
import { generateCodes } from '@/lib/codes';

const PLANS: Record<string, { credits: number; label: string }> = {
  single: { credits: 1, label: '单次验证' },
  triple: { credits: 3, label: '3 次套餐' },
  ten: { credits: 10, label: '10 次套餐' },
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
