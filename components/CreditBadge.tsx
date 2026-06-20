'use client';

import { useEffect, useState } from 'react';
import { getClientId, getAuthHeaders } from '@/lib/client-id';

export default function CreditBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  const fetchBalance = () => {
    const userId = getClientId();
    if (!userId) return;
    fetch('/api/credits', { headers: { ...getAuthHeaders() } })
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
      className="text-xs rounded-full px-3 py-1.5 transition-all" style={{color:'rgba(0,0,0,0.45)', background:'rgba(79,139,255,0.06)', border:'1px solid rgba(79,139,255,0.1)', backdropFilter:'blur(8px)'}}
    >
      剩余 {balance} 积分
    </a>
  );
}
