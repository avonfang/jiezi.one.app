import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jiezi123';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (password === ADMIN_PASSWORD) {
      return Response.json({ success: true });
    }
    return Response.json({ error: '密码错误' }, { status: 401 });
  } catch {
    return Response.json({ error: '验证失败' }, { status: 500 });
  }
}
