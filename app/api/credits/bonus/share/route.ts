import { NextRequest } from 'next/server';
import { addCredits, getBalance } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }

  // Rate limit: max 3 share bonuses per day per user
  const rateKey = `share-bonus:${userId}`;
  const { allowed } = await checkRateLimit(rateKey, 3, 86400000);
  if (!allowed) {
    return Response.json({ error: '今日分享奖励已达上限' }, { status: 429 });
  }

  const balance = await addCredits(userId, 5);
  return Response.json({ success: true, balance });
}
