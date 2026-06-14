'use client';

import { useEffect, useState } from 'react';
import { getClientId } from '@/lib/client-id';

export default function CreditBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = () => {
    const userId = getClientId();
    if (!userId) return;
    fetch('/api/credits', { headers: { 'x-client-id': userId } })
      .then(r => r.json())
      .then(data => setBalance(data.balance))
      .catch(() => setBalance(0));
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // Listen for credit changes
  useEffect(() => {
    window.addEventListener('credits-changed', fetchBalance);
    return () => window.removeEventListener('credits-changed', fetchBalance);
  }, []);

  // Refresh after payment return
  useEffect(() => {
    if (window.location.search.includes('success=1')) {
      fetchBalance();
    }
  }, []);

  if (balance === null) return null;

  return (
    <a
      href="/pricing"
      className="text-xs text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-full px-3 py-1.5 border border-gray-200 transition-colors"
    >
      剩余 {balance} 积分
    </a>
  );
}
