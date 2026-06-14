export function getClientId(): string {
  if (typeof window === 'undefined') return '';

  // Check for registered user first
  const userId = localStorage.getItem('jiezi-user-id');
  if (userId) return userId;

  // Fall back to anonymous client ID
  let id = localStorage.getItem('jiezi-client-id');
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem('jiezi-client-id', id);
  }
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
}
