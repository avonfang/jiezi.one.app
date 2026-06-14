import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rl = await checkRateLimit(`admin-login:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return Response.json({ error: '尝试次数过多，请稍后重试' }, { status: 429 });
    }

    const { password } = await request.json();
    if (checkAdminAuth(request) || password === (process.env.ADMIN_PASSWORD || 'jiezi123')) {
      return Response.json({ success: true });
    }
    return Response.json({ error: '密码错误' }, { status: 401 });
  } catch {
    return Response.json({ error: '验证失败' }, { status: 500 });
  }
}
