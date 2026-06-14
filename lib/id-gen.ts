import crypto from 'crypto';

export function generateId(prefix = ''): string {
  return prefix + crypto.randomBytes(16).toString('hex');
}

export function generateShortId(length = 8): string {
  return crypto.randomBytes(length).toString('hex');
}
