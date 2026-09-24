import { NextRequest } from 'next/server';
import { kvIncr, kvSadd } from '@/lib/kv-store';
import { getUserIdFromRequest } from '@/lib/get-user';

function dayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// 每次页面访问 +1（访问次数）；同时按天记录独立访客（UV）。
export async function POST(request: NextRequest) {
  try {
    const d = dayStr();
    await kvIncr('stats:visits:total', 1);
    await kvIncr('stats:visits:' + d, 1);
    const uid = getUserIdFromRequest(request) || 'anon';
    await kvSadd('stats:uv:' + d, uid);
    await kvSadd('stats:uv:all', uid);
    return Response.json({ ok: true });
  } catch (error) {
    console.error('track error:', error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
