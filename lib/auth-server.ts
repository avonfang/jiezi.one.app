import crypto from 'crypto';
import { kvGet, kvSet, kvDel } from './kv-store';

const AUTH_KEY = 'auth:users';
const EMAIL_KEY = 'auth:emails';
const RESET_PREFIX = 'reset_token:';

interface StoredUser {
  userId: string;
  passwordHash: string;
  salt: string;
  email: string;
  createdAt: number;
}

async function readUsers(): Promise<Record<string, StoredUser>> {
  const data = await kvGet<Record<string, StoredUser>>(AUTH_KEY);
  return data || {};
}

function writeUsers(users: Record<string, StoredUser>): Promise<void> {
  return kvSet(AUTH_KEY, users);
}

async function readEmailMap(): Promise<Record<string, string>> {
  const data = await kvGet<Record<string, string>>(EMAIL_KEY);
  return data || {};
}

function writeEmailMap(map: Record<string, string>): Promise<void> {
  return kvSet(EMAIL_KEY, map);
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export async function registerUser(username: string, password: string, email?: string): Promise<{ userId: string }> {
  const cleaned = username.trim().toLowerCase();
  if (cleaned.length < 2) throw new Error('用户名至少 2 个字符');
  if (password.length < 4) throw new Error('密码至少 4 个字符');

  const users = await readUsers();
  if (users[cleaned]) throw new Error('用户名已存在');

  // Check email uniqueness if provided
  if (email) {
    const emailStr = email.trim().toLowerCase();
    if (!emailStr.includes('@')) throw new Error('邮箱格式不正确');
    const emailMap = await readEmailMap();
    if (emailMap[emailStr]) throw new Error('该邮箱已被注册');
    emailMap[emailStr] = cleaned;
    await writeEmailMap(emailMap);
  }

  const userId = 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const salt = crypto.randomBytes(16).toString('hex');
  users[cleaned] = {
    userId,
    passwordHash: hashPassword(password, salt),
    salt,
    email: (email || '').trim().toLowerCase(),
    createdAt: Date.now(),
  };

  await writeUsers(users);
  return { userId };
}

export async function loginUser(username: string, password: string): Promise<{ userId: string } | null> {
  const cleaned = username.trim().toLowerCase();
  const users = await readUsers();
  const user = users[cleaned];
  if (!user) return null;

  const attemptHash = hashPassword(password, user.salt);
  if (attemptHash !== user.passwordHash) return null;

  return { userId: user.userId };
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  const cleaned = username.trim().toLowerCase();
  const users = await readUsers();
  const user = users[cleaned];
  return user ? user.userId : null;
}

export async function getUserByEmail(email: string): Promise<{ username: string; userId: string } | null> {
  const emailStr = email.trim().toLowerCase();
  const emailMap = await readEmailMap();
  const username = emailMap[emailStr];
  if (!username) return null;

  const users = await readUsers();
  const user = users[username];
  if (!user) return null;

  return { username, userId: user.userId };
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  if (newPassword.length < 4) throw new Error('密码至少 4 个字符');

  const users = await readUsers();
  const entry = Object.entries(users).find(([, u]) => u.userId === userId);
  if (!entry) throw new Error('用户不存在');

  const [username] = entry;
  const salt = crypto.randomBytes(16).toString('hex');
  users[username].passwordHash = hashPassword(newPassword, salt);
  users[username].salt = salt;
  await writeUsers(users);
}

export async function getUsernameByUserId(userId: string): Promise<string | null> {
  const users = await readUsers();
  const entry = Object.entries(users).find(([, u]) => u.userId === userId);
  return entry ? entry[0] : null;
}

// Reset token functions
export async function createResetToken(userId: string, email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await kvSet(RESET_PREFIX + token, {
    userId,
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + 3600000, // 1 hour
  });
  return token;
}

export async function verifyResetToken(token: string): Promise<{ userId: string } | null> {
  const data = await kvGet<{ userId: string; email: string; expiresAt: number }>(RESET_PREFIX + token);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    await kvDel(RESET_PREFIX + token);
    return null;
  }
  return { userId: data.userId };
}

export async function consumeResetToken(token: string): Promise<void> {
  await kvDel(RESET_PREFIX + token);
}
