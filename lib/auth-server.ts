import crypto from 'crypto';
import { kvGet, kvSet, kvDel } from './kv-store';

const AUTH_KEY = 'auth:users';
const RESET_PREFIX = 'reset_token:';

interface StoredUser {
  userId: string;
  passwordHash: string;
  salt: string;
  email: string;
  name: string; // display name (optional)
  createdAt: number;
}

async function readUsers(): Promise<Record<string, StoredUser>> {
  const data = await kvGet<Record<string, StoredUser>>(AUTH_KEY);
  return data || {};
}

function writeUsers(users: Record<string, StoredUser>): Promise<void> {
  return kvSet(AUTH_KEY, users);
}

const PBKDF2_ITERATIONS = parseInt(process.env.PBKDF2_ITERATIONS || '600000', 10);

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
}

export async function registerUser(email: string, password: string, name?: string): Promise<{ userId: string }> {
  const emailStr = email.trim().toLowerCase();
  if (!emailStr.includes('@')) throw new Error('邮箱格式不正确');
  if (password.length < 4) throw new Error('密码至少 4 个字符');

  const users = await readUsers();
  if (users[emailStr]) {
    // Return generic error to prevent email enumeration
    throw new Error('注册失败，请检查信息后重试');
  }

  const userId = 'u_' + crypto.randomBytes(12).toString('hex');
  const salt = crypto.randomBytes(16).toString('hex');
  users[emailStr] = {
    userId,
    passwordHash: hashPassword(password, salt),
    salt,
    email: emailStr,
    name: (name || '').trim() || emailStr.split('@')[0],
    createdAt: Date.now(),
  };

  await writeUsers(users);
  return { userId };
}

export async function loginUser(emailOrUsername: string, password: string): Promise<{ userId: string; name: string } | null> {
  const cleaned = emailOrUsername.trim().toLowerCase();
  const users = await readUsers();

  // First try email lookup
  let user = users[cleaned];
  // If not found, try username lookup (backward compat for old accounts)
  if (!user) {
    const entry = Object.entries(users).find(([, u]) => u.name?.toLowerCase() === cleaned);
    if (entry) user = entry[1];
  }

  if (!user) return null;

  const attemptHash = hashPassword(password, user.salt);
  const actualHash = user.passwordHash;

  // Constant-time comparison to prevent timing attacks
  const buf1 = Buffer.from(attemptHash, 'hex');
  const buf2 = Buffer.from(actualHash, 'hex');
  if (buf1.length !== buf2.length || !crypto.timingSafeEqual(buf1, buf2)) return null;

  return { userId: user.userId, name: user.name || user.email.split('@')[0] };
}

export async function getUserByEmail(email: string): Promise<{ userId: string; name: string } | null> {
  const emailStr = email.trim().toLowerCase();
  const users = await readUsers();
  const user = users[emailStr];
  if (!user) return null;
  return { userId: user.userId, name: user.name || emailStr.split('@')[0] };
}

export async function getUserByUserId(userId: string): Promise<{ email: string; name: string } | null> {
  const users = await readUsers();
  const entry = Object.entries(users).find(([, u]) => u.userId === userId);
  if (!entry) return null;
  return { email: entry[1].email, name: entry[1].name || entry[1].email.split('@')[0] };
}

export async function updatePassword(userId: string, newPassword: string): Promise<void> {
  if (newPassword.length < 4) throw new Error('密码至少 4 个字符');

  const users = await readUsers();
  const entry = Object.entries(users).find(([, u]) => u.userId === userId);
  if (!entry) throw new Error('操作失败');

  const salt = crypto.randomBytes(16).toString('hex');
  entry[1].passwordHash = hashPassword(newPassword, salt);
  entry[1].salt = salt;
  await writeUsers(users);
}

export async function getUserIdByUsername(username: string): Promise<string | null> {
  // Backward compat: lookup by name field
  const cleaned = username.trim().toLowerCase();
  const users = await readUsers();
  const entry = Object.entries(users).find(([, u]) => u.name?.toLowerCase() === cleaned);
  return entry ? entry[1].userId : null;
}

// Reset token functions
export async function createResetToken(userId: string, email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  await kvSet(RESET_PREFIX + token, {
    userId,
    email: email.trim().toLowerCase(),
    expiresAt: Date.now() + 3600000,
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
