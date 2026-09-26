import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth-server';
import { createToken } from '@/lib/auth-token';
import { initCredits, transferLegacyAnonymousCredits } from '@/lib/credits';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(`register:${ip}`, 5, 60000);
    if (!rl.allowed) {
      return Response.json({ error: '请求过于频繁，请稍后重试' }, { status: 429 });
    }

    const { email, password, name, anonymousId } = await request.json();

    if (!email || !password) {
      return Response.json({ error: '请填写邮箱和密码' }, { status: 400 });
    }

    const result = await registerUser(email, password, name);
    await initCredits(result.userId);
    await transferLegacyAnonymousCredits(result.userId, anonymousId);

    const token = createToken(result.userId);
    return Response.json({ success: true, userId: result.userId, name: name || email.split('@')[0], token });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '注册失败';
    return Response.json({ error: msg }, { status: 400 });
  }
}
