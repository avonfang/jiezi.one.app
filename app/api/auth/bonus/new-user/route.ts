import { NextRequest } from 'next/server';
import { addCredits, getBalance, initCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }

  await initCredits(userId);

  // Track whether bonus has already been claimed via kv-store
  const { kvGet, kvSet } = await import('@/lib/kv-store');
  const bonusKey = `bonus:new-user:${userId}`;
  const claimed = await kvGet<boolean>(bonusKey);

  if (claimed) {
    const balance = await getBalance(userId);
    return Response.json({ success: true, balance, alreadyClaimed: true });
  }

  // Grant 20 credits as new-user bonus
  const balance = await addCredits(userId, 20);
  await kvSet(bonusKey, true);

  return Response.json({ success: true, balance, alreadyClaimed: false });
}
