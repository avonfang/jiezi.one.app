import { NextRequest } from 'next/server';
import { loginUser } from '@/lib/auth-server';
import { initCredits, getBalance } from '@/lib/credits';

export async function POST(request: NextRequest) {
  try {
    const { username, password, anonymousId } = await request.json();

    if (!username || !password) {
      return Response.json({ error: '请填写用户名和密码' }, { status: 400 });
    }

    const result = await loginUser(username, password);
    if (!result) {
      return Response.json({ error: '用户名或密码错误' }, { status: 401 });
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

    return Response.json({ success: true, userId: result.userId });
  } catch {
    return Response.json({ error: '登录失败' }, { status: 500 });
  }
}
