import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { listRegisteredUsers } from '@/lib/admin-users';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const users = await listRegisteredUsers();
    return Response.json({ users, total: users.length }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin users error:', error);
    return Response.json({ error: '查询失败' }, { status: 503 });
  }
}
