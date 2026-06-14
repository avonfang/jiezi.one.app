import { NextRequest } from 'next/server';
import { initCredits, getBalance } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return Response.json({ balance: 0 });
  }
  await initCredits(userId);
  const balance = await getBalance(userId);
  return Response.json({ balance });
}
