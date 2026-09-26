import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export function isAdminPassword(password: unknown): boolean {
  return typeof password === 'string'
    && !!ADMIN_PASSWORD
    && ADMIN_PASSWORD !== 'jiezi123'
    && password === ADMIN_PASSWORD;
}

export function checkAdminAuth(request: NextRequest): boolean {
  // Check Authorization header first
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (isAdminPassword(token)) return true;
  }

  // Check x-admin-password header as fallback
  const headerPw = request.headers.get('x-admin-password');
  if (isAdminPassword(headerPw)) return true;

  return false;
}
