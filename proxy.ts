import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createToken, verifyToken } from '@/lib/auth-token';
import { GUEST_COOKIE } from '@/lib/get-user';

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(GUEST_COOKIE)?.value;
  const payload = existing ? verifyToken(existing) : null;
  if (payload?.type === 'anonymous' && payload.userId.startsWith('anon_')) {
    return NextResponse.next();
  }

  // Configuration errors must not turn a page request into an outage.
  if (!process.env.AUTH_TOKEN_SECRET || process.env.AUTH_TOKEN_SECRET === '[SENSITIVE]') {
    return NextResponse.next();
  }

  const token = createToken('anon_' + randomUUID(), 'anonymous');
  const headers = new Headers(request.headers);
  headers.set('cookie', [request.headers.get('cookie'), `${GUEST_COOKIE}=${token}`].filter(Boolean).join('; '));
  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(GUEST_COOKIE, token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}

export const config = {
  matcher: ['/((?!_next/|preview/|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js)$).*)'],
};
