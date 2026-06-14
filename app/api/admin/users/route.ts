import { kvGet } from '@/lib/kv-store';

const AUTH_KEY = 'auth:users';

export async function GET() {
  try {
    const users = await kvGet<Record<string, {
      userId: string;
      email: string;
      name: string;
      createdAt: number;
    }>>(AUTH_KEY);

    if (!users) {
      return Response.json({ users: [], total: 0 });
    }

    const list = Object.entries(users).map(([email, user]) => ({
      email,
      userId: user.userId,
      name: user.name || email.split('@')[0],
      createdAt: user.createdAt,
    })).sort((a, b) => b.createdAt - a.createdAt);

    return Response.json({ users: list, total: list.length });
  } catch (error) {
    console.error('Admin users error:', error);
    return Response.json({ users: [], total: 0, error: '查询失败' });
  }
}
