import { NextRequest } from 'next/server';
import { getBalance, addCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const { userId, action, amount } = await request.json();

    if (!userId || !action) {
      return Response.json({ error: '参数不完整' }, { status: 400 });
    }

    if (action === 'lookup') {
      const balance = await getBalance(userId);
      return Response.json({ userId, balance });
    }

    if (action === 'add') {
      if (!amount || amount < 1) {
        return Response.json({ error: '数量不合法' }, { status: 400 });
      }
      const newBalance = await addCredits(userId, amount);
      return Response.json({ userId, balance: newBalance, success: true });
    }

    return Response.json({ error: '未知操作' }, { status: 400 });
  } catch {
    return Response.json({ error: '操作失败' }, { status: 500 });
  }
}
