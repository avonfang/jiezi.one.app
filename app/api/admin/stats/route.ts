import { NextRequest } from 'next/server';
import { kvGet, kvScard, kvKeys } from '@/lib/kv-store';
import { checkAdminAuth } from '@/lib/admin-auth';

function dayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const totalVisits = (await kvGet<number>('stats:visits:total')) ?? 0;
    const todayVisits = (await kvGet<number>('stats:visits:' + dayStr())) ?? 0;
    const totalUv = await kvScard('stats:uv:all');
    const todayUv = await kvScard('stats:uv:' + dayStr());

    const users = await kvGet<Record<string, unknown>>('auth:users');
    const registeredUsers = users ? Object.keys(users).length : 0;

    // 近 7 天访问趋势
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = 'stats:visits:' + dayStr(d);
      const v = (await kvGet<number>(key)) ?? 0;
      days.push({ date: dayStr(d).slice(5), visits: v });
    }

    return Response.json({
      totalVisits,
      todayVisits,
      totalUv,
      todayUv,
      registeredUsers,
      days,
    });
  } catch (error) {
    console.error('admin stats error:', error);
    return Response.json({ error: '查询失败' }, { status: 500 });
  }
}
