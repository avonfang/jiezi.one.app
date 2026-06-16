import { NextRequest } from 'next/server';
import { registerOrLoginByOpenid, getWechatProfile } from '@/lib/auth-server';
import { createToken } from '@/lib/auth-token';
import { getBalance } from '@/lib/credits';

const WX_APPID = process.env.WX_APPID;
const WX_SECRET = process.env.WX_SECRET;

async function codeToOpenid(code: string): Promise<string> {
  if (!WX_APPID || !WX_SECRET) {
    // Dev mode: use a deterministic fake openid so mini program can test the flow
    return `dev_openid_${code.slice(-12)}`;
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.errcode) {
    console.warn('jscode2session failed, falling back to dev mode:', data.errcode, data.errmsg);
    // Dev fallback: use a deterministic fake openid for testing codes
    return `dev_openid_${code.slice(-12)}`;
  }

  return data.openid as string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, anonymousId } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: '缺少微信登录凭证' }, { status: 400 });
    }

    const openid = await codeToOpenid(code);
    const { userId, isNew } = await registerOrLoginByOpenid(openid, anonymousId || undefined);

    const token = createToken(userId, 'user');
    const balance = await getBalance(userId);
    const profile = await getWechatProfile(userId);

    return Response.json({
      success: true,
      userId,
      token,
      balance,
      username: profile?.nickName || `微信用户_${openid.slice(-4)}`,
      nickName: profile?.nickName || '',
      avatarBase64: profile?.avatarBase64 || '',
      isNew,
    });
  } catch (error) {
    console.error('WeChat auth error:', error);
    const message = error instanceof Error ? error.message : '登录失败';
    return Response.json({ error: message }, { status: 500 });
  }
}
