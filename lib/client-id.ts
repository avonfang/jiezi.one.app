const TOKEN_KEY = 'jiezi-auth-token';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function getClientId(): string {
  if (typeof window === 'undefined') return '';

  // Check for registered user first
  const userId = safeGet('jiezi-user-id');
  if (userId) return userId;

  // Fall back to anonymous client ID
  let id = safeGet('jiezi-client-id');
  if (id) return id;

  // Generate new anonymous ID
  id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  safeSet('jiezi-client-id', id);

  return id;
}

export function getUsername(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jiezi-username');
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('jiezi-user-id');
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('jiezi-user-id');
  localStorage.removeItem('jiezi-username');
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get auth headers: uses Bearer token if available, falls back to x-client-id
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return { 'x-client-id': getClientId() };
}
