import { NextRequest } from 'next/server';
import { loginUser } from '@/lib/auth-server';
import { initCredits, getBalance } from '@/lib/credits';
import { createToken } from '@/lib/auth-token';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(`login:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return Response.json({ error: '请求过于频繁，请稍后重试' }, { status: 429 });
    }

    const { email, password, anonymousId } = await request.json();

    if (!email || !password) {
      return Response.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    const result = await loginUser(email, password);
    if (!result) {
      return Response.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // Ensure credits file exists for this user
    await initCredits(result.userId);

    // Merge anonymous credits if provided and different from account
    if (anonymousId && anonymousId !== result.userId) {
      const anonBalance = await getBalance(anonymousId);
      if (anonBalance > 0) {
        const accountBalance = await getBalance(result.userId);
        if (accountBalance === 0) {
          const { addCredits } = await import('@/lib/credits');
          await addCredits(result.userId, anonBalance);
        }
      }
    }

    const token = createToken(result.userId);
    return Response.json({ success: true, userId: result.userId, name: result.name, token });
  } catch {
    return Response.json({ error: '登录失败' }, { status: 500 });
  }
}
