import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/get-user';
import { addCredits, initCredits } from '@/lib/credits';

export async function POST(request: NextRequest) {
  // Only available in dev/preview environments
  if (process.env.VERCEL_ENV === 'production') {
    return Response.json({ error: '仅在开发环境可用' }, { status: 403 });
  }

  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }

  const { amount } = await request.json();
  const creditAmount = amount || 1000;

  await initCredits(userId);
  const newBalance = await addCredits(userId, creditAmount);

  return Response.json({ success: true, userId, balance: newBalance });
}
