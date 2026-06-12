import { NextRequest } from 'next/server';
import { initCredits, getBalance } from '@/lib/credits';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-client-id');
  if (!userId) {
    return Response.json({ balance: 0 });
  }
  await initCredits(userId);
  const balance = await getBalance(userId);
  return Response.json({ balance });
}
