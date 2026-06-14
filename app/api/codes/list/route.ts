import { NextRequest } from 'next/server';
import { listCodes } from '@/lib/codes';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const codes = await listCodes();
    return Response.json({ codes });
  } catch {
    return Response.json({ codes: [] });
  }
}
