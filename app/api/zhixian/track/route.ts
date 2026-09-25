import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/get-user';
import { trackVisit } from '@/lib/zhixian/stats';

// 仙人指路页面访问埋点。前端每次新会话加载页面时上报一次。
export async function POST(request: NextRequest) {
  try {
    const uid = getUserIdFromRequest(request) || 'anon';
    await trackVisit(uid);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('zhixian track error:', error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
