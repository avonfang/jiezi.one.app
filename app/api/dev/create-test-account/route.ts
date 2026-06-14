import { NextRequest } from 'next/server';
import { kvGet, kvSet } from '@/lib/kv-store';
import { registerUser } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return Response.json({ error: '缺少 username/password' }, { status: 400 });
    }

    const result = await registerUser(username, password);
    await kvSet(`credits:${result.userId}`, {
      balance: 100, total_purchased: 100, created_at: Date.now(),
    });

    return Response.json({ success: true, userId: result.userId, balance: 100 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '操作失败';
    return Response.json({ error: msg }, { status: 500 });
  }
}
