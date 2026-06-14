import { verifyToken } from './auth-token';

/**
 * Get the authenticated user ID from a request.
 * Priority: Authorization Bearer token > x-client-id header
 */
export function getUserIdFromRequest(request: Request): string | null {
  // Try Bearer token first
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7));
    if (payload) {
      return payload.userId;
    }
  }

  // Fall back to x-client-id (legacy/anonymous users)
  return request.headers.get('x-client-id');
}
