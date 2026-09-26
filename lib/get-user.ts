import { verifyToken } from './auth-token';

export const GUEST_COOKIE = 'jiezi-guest';

export function getAuthenticatedUserIdFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const payload = verifyToken(auth.slice(7));
  return payload?.type === 'user' ? payload.userId : null;
}

export function getAnonymousUserIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') || '';
  const value = cookie.split(';').map(part => part.trim()).find(part => part.startsWith(GUEST_COOKIE + '='))?.slice(GUEST_COOKIE.length + 1);
  if (!value) return null;
  const payload = verifyToken(value);
  return payload?.type === 'anonymous' && payload.userId.startsWith('anon_') ? payload.userId : null;
}

/**
 * Get the authenticated user ID from a request.
 * A signed account token takes priority; anonymous users have a signed,
 * HttpOnly cookie issued by proxy.ts. Never trust a caller-supplied user ID.
 */
export function getUserIdFromRequest(request: Request): string | null {
  if (request.headers.get('authorization')?.startsWith('Bearer ')) {
    return getAuthenticatedUserIdFromRequest(request);
  }
  return getAnonymousUserIdFromRequest(request);
}
