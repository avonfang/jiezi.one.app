import { NextRequest } from 'next/server';
import { kvGet } from '@/lib/kv-store';
import { checkAdminAuth } from '@/lib/admin-auth';

const FEEDBACK_KEY = 'feedback:all';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const feedbacks = await kvGet<any[]>(FEEDBACK_KEY) || [];
    return Response.json({ feedbacks });
  } catch {
    return Response.json({ feedbacks: [] });
  }
}
