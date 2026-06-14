import { NextRequest } from 'next/server';
import { getUserByEmail, createResetToken } from '@/lib/auth-server';
import { sendResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rl = await checkRateLimit(`forgot-password:${ip}`, 5, 60000);
    if (!rl.allowed) {
      return Response.json({ error: '请求过于频繁，请稍后重试' }, { status: 429 });
    }

    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: '请填写有效的邮箱地址' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return Response.json({ success: true, message: '如果该邮箱已注册，你将收到重置邮件' });
    }

    const token = await createResetToken(user.userId, email);
    const sent = await sendResetEmail(email, token);

    if (!sent) {
      return Response.json({ error: '邮件发送失败，请稍后重试' }, { status: 500 });
    }

    return Response.json({ success: true, message: '重置邮件已发送，请查看收件箱' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json({ error: '操作失败，请稍后重试' }, { status: 500 });
  }
}
