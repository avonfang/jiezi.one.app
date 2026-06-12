export function getClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('jiezi-client-id');
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem('jiezi-client-id', id);
  }
  return id;
}
