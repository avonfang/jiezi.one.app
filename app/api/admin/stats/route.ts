import { NextRequest } from 'next/server';
import { kvGet, kvScard } from '@/lib/kv-store';
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
    const today = dayStr();
    const totalVisits = (await kvGet<number>('stats:visits:total')) ?? 0;
    const todayVisits = (await kvGet<number>('stats:visits:' + today)) ?? 0;
    const totalUv = await kvScard('stats:uv:all');
    const todayUv = await kvScard('stats:uv:' + today);

    const users = await kvGet<Record<string, unknown>>('auth:users');
    const registeredUsers = users ? Object.keys(users).length : 0;

    // 近 7 天全站访问趋势
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = 'stats:visits:' + dayStr(d);
      const v = (await kvGet<number>(key)) ?? 0;
      days.push({ date: dayStr(d).slice(5), visits: v });
    }

    // ── 仙人指路专属统计 ──────────────────────────────
    const zxTotalVisits = (await kvGet<number>('zx:visit:total')) ?? 0;
    const zxTodayVisits = (await kvGet<number>('zx:visit:' + today)) ?? 0;
    const zxTotalUv = await kvScard('zx:uv:all');
    const zxTodayUv = await kvScard('zx:uv:' + today);
    const zxTotalMatches = (await kvGet<number>('zx:match:total')) ?? 0;
    const zxTodayMatches = (await kvGet<number>('zx:match:' + today)) ?? 0;
    const zxFreeMatches = (await kvGet<number>('zx:match:free:total')) ?? 0;
    const zxPaidMatches = (await kvGet<number>('zx:match:paid:total')) ?? 0;
    const zxTotalUnlocks = (await kvGet<number>('zx:unlock:total')) ?? 0;
    const zxTodayUnlocks = (await kvGet<number>('zx:unlock:' + today)) ?? 0;
    const revenueOrders = (await kvGet<number>('revenue:orders:total')) ?? 0;
    const revenueCents = (await kvGet<number>('revenue:amount:total')) ?? 0;
    const revenueCredits = (await kvGet<number>('revenue:credits:total')) ?? 0;

    const zxDays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const ds = dayStr(d);
      zxDays.push({
        date: ds.slice(5),
        visits: (await kvGet<number>('zx:visit:' + ds)) ?? 0,
        matches: (await kvGet<number>('zx:match:' + ds)) ?? 0,
        unlocks: (await kvGet<number>('zx:unlock:' + ds)) ?? 0,
      });
    }

    return Response.json({
      totalVisits,
      todayVisits,
      totalUv,
      todayUv,
      registeredUsers,
      days,
      revenue: {
        orders: revenueOrders,
        cents: revenueCents,
        credits: revenueCredits,
      },
      zhixian: {
        totalVisits: zxTotalVisits,
        todayVisits: zxTodayVisits,
        totalUv: zxTotalUv,
        todayUv: zxTodayUv,
        totalMatches: zxTotalMatches,
        todayMatches: zxTodayMatches,
        freeMatches: zxFreeMatches,
        paidMatches: zxPaidMatches,
        totalUnlocks: zxTotalUnlocks,
        todayUnlocks: zxTodayUnlocks,
        days: zxDays,
      },
    });
  } catch (error) {
    console.error('admin stats error:', error);
    return Response.json({ error: '查询失败' }, { status: 500 });
  }
}
