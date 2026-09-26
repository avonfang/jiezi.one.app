import crypto from 'crypto';

function tokenSecret(): string {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret || secret === '[SENSITIVE]') {
    throw new Error('AUTH_TOKEN_SECRET is not configured');
  }
  return secret;
}
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface TokenPayload {
  userId: string;
  type: 'user' | 'admin' | 'anonymous';
  iat: number;
  exp: number;
}

export function createToken(userId: string, type: TokenPayload['type'] = 'user'): string {
  const iat = Date.now();
  const exp = iat + TOKEN_EXPIRY;
  const payload: TokenPayload = { userId, type, iat, exp };
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = crypto.createHmac('sha256', tokenSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encoded, sig] = parts;

    const expectedSig = crypto.createHmac('sha256', tokenSecret()).update(encoded).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (Date.now() > payload.exp || !payload.userId || !['user', 'admin', 'anonymous'].includes(payload.type)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}
