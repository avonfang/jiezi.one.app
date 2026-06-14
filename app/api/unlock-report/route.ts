import { NextRequest } from 'next/server';
import { initCredits, useCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

export async function POST(request: NextRequest) {
  try {
    const clientId = getUserIdFromRequest(request) || '';
    if (!clientId) {
      return Response.json({ error: '缺少用户标识' }, { status: 400 });
    }

    await initCredits(clientId);
    const deducted = await useCredits(clientId, 2);
    if (!deducted) {
      return Response.json(
        { error: '积分不足，请充值', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Unlock report error:', error);
    return Response.json({ error: '解锁失败，请稍后重试' }, { status: 500 });
  }
}
