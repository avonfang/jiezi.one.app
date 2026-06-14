import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'jiezi123';

export function checkAdminAuth(request: NextRequest): boolean {
  // Check Authorization header first
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (token === ADMIN_PASSWORD) return true;
  }

  // Check x-admin-password header as fallback
  const headerPw = request.headers.get('x-admin-password');
  if (headerPw === ADMIN_PASSWORD) return true;

  return false;
}
