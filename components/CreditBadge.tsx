'use client';

import { useEffect, useState } from 'react';

export default function CreditBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const userId = getOrCreateClientId();
    fetch('/api/credits', { headers: { 'x-client-id': userId } })
      .then(r => r.json())
      .then(data => setBalance(data.balance))
      .catch(() => setBalance(0));
  }, []);

  // Refresh after payment return
  useEffect(() => {
    if (window.location.search.includes('success=1')) {
      const userId = getOrCreateClientId();
      fetch('/api/credits', { headers: { 'x-client-id': userId } })
        .then(r => r.json())
        .then(data => setBalance(data.balance));
    }
  }, []);

  if (balance === null) return null;

  return (
    <a
      href="/pricing"
      className="text-xs text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full px-3 py-1.5 border border-gray-200 transition-colors"
    >
      剩余 {balance} 次
    </a>
  );
}

function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('jiezi-client-id');
  if (!id) {
    id = crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem('jiezi-client-id', id);
  }
  return id;
}
