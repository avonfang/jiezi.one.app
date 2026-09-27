import { kvGetStrict, kvScanKeys } from './kv-store';

export type AdminUser = {
  userId: string;
  email: string | null;
  name: string;
  createdAt: number;
  source: 'email' | 'wechat';
};

type EmailUserRecord = {
  userId?: unknown;
  name?: unknown;
  createdAt?: unknown;
};

type WechatUserRecord = {
  userId?: unknown;
  name?: unknown;
  createdAt?: unknown;
  type?: unknown;
  openid?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'string') {
    try { return asRecord(JSON.parse(value)); } catch { return null; }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

/** The shared definition of a registered account: email + WeChat, never anonymous guests. */
export async function listRegisteredUsers(): Promise<AdminUser[]> {
  const [emailData, wechatKeys] = await Promise.all([
    kvGetStrict<Record<string, EmailUserRecord>>('auth:users'),
    kvScanKeys('auth:users:*'),
  ]);
  const users: AdminUser[] = [];
  const seen = new Set<string>();

  for (const [email, raw] of Object.entries(emailData || {})) {
    const user = asRecord(raw) as EmailUserRecord | null;
    if (!user || typeof user.userId !== 'string' || !user.userId) continue;
    seen.add(user.userId);
    users.push({
      userId: user.userId,
      email,
      name: typeof user.name === 'string' && user.name ? user.name : email.split('@')[0],
      createdAt: typeof user.createdAt === 'number' ? user.createdAt : 0,
      source: 'email',
    });
  }

  for (let i = 0; i < wechatKeys.length; i += 50) {
    const records = await Promise.all(wechatKeys.slice(i, i + 50).map(key => kvGetStrict<WechatUserRecord | string>(key)));
    for (const raw of records) {
      const user = asRecord(raw) as WechatUserRecord | null;
      if (!user || typeof user.userId !== 'string' || !user.userId || seen.has(user.userId)) continue;
      if (user.type !== 'wechat' && typeof user.openid !== 'string') continue;
      seen.add(user.userId);
      users.push({
        userId: user.userId,
        email: null,
        name: typeof user.name === 'string' && user.name ? user.name : '微信用户',
        createdAt: typeof user.createdAt === 'number' ? user.createdAt : 0,
        source: 'wechat',
      });
    }
  }

  return users.sort((a, b) => b.createdAt - a.createdAt);
}
