import { NextRequest } from 'next/server';
import { getBalance } from '@/lib/credits';
import { getAuthenticatedUserIdFromRequest } from '@/lib/get-user';

export async function POST(request: NextRequest) {
  const userId = getAuthenticatedUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ error: '未登录' }, { status: 401 });
  }

  // Initial credits are granted during account creation. This legacy endpoint
  // must never grant the same welcome balance a second time.
  return Response.json({ success: true, balance: await getBalance(userId), alreadyClaimed: true });
}
