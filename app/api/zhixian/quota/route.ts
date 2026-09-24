import { NextRequest } from 'next/server';
import { initCredits, getBalance } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';
import { getFreeTestUsed, freeTestRemaining, FREE_TEST_LIMIT, TEST_COST } from '@/lib/zhixian/quota';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return Response.json({ freeUsed: 0, freeRemaining: FREE_TEST_LIMIT, testCost: TEST_COST, balance: 0 });
    }
    await initCredits(userId);
    const freeUsed = await getFreeTestUsed(userId);
    const balance = await getBalance(userId);
    return Response.json({
      freeUsed,
      freeRemaining: await freeTestRemaining(userId),
      testCost: TEST_COST,
      balance,
    });
  } catch (error) {
    console.error('zhixian quota error:', error);
    return Response.json({ freeUsed: 0, freeRemaining: FREE_TEST_LIMIT, testCost: TEST_COST, balance: 0 });
  }
}
