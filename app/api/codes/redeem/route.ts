import { NextRequest } from 'next/server';
import { redeemCode } from '@/lib/codes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId } = body as { code: string; userId: string };
    if (!code) return Response.json({ error: '请输入激活码' }, { status: 400 });
    if (!userId) return Response.json({ error: '缺少用户标识' }, { status: 400 });

    const result = await redeemCode(code, userId);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

    return Response.json({ success: true, credits: result.credits });
  } catch {
    return Response.json({ error: '兑换失败' }, { status: 500 });
  }
}
