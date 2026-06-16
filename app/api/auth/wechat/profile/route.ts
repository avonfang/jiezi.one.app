import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from '@/lib/get-user';
import { updateWechatProfile, getWechatProfile } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: '未登录' }, { status: 401 });

  const profile = await getWechatProfile(userId);
  if (!profile) return Response.json({ error: '用户不存在' }, { status: 404 });

  return Response.json({ success: true, ...profile });
}

export async function PUT(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) return Response.json({ error: '未登录' }, { status: 401 });

  const { nickName, avatarBase64 } = await request.json();
  if (!nickName && !avatarBase64) {
    return Response.json({ error: '没有需要更新的数据' }, { status: 400 });
  }

  try {
    await updateWechatProfile(userId, { nickName, avatarBase64 });
    return Response.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({ error: '更新失败' }, { status: 500 });
  }
}
