import { NextRequest } from 'next/server';
import { getRecentValidations } from '@/lib/recent-validations';

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 20);
  const records = await getRecentValidations(limit);
  return Response.json({ records });
}
