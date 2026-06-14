import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth-server';
import { initCredits, getBalance } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const { username, password, email, anonymousId } = await request.json();

    if (!username || !password) {
      return Response.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const result = await registerUser(username, password, email);

    // Transfer credits from anonymous account if provided
    if (anonymousId) {
      await initCredits(anonymousId);
      const anonBalance = await getBalance(anonymousId);
      if (anonBalance > 0) {
        const { addCredits } = await import('@/lib/credits');
        await initCredits(result.userId);
        await addCredits(result.userId, anonBalance);
      }
    }

    return Response.json({ success: true, userId: result.userId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '注册失败';
    return Response.json({ error: msg }, { status: 400 });
  }
}
