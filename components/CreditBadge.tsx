'use client';

import { useEffect, useState } from 'react';
import { getClientId, getAuthHeaders, getUsername } from '@/lib/client-id';

export default function CreditBadge() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(() => !!getUsername());

  const fetchBalance = () => {
    const userId = getClientId();
    if (!userId) return;
    fetch('/api/credits', { headers: { ...getAuthHeaders() } })
      .then(r => r.json())
      .then(data => setBalance(data.balance))
      .catch(() => setBalance(0));
  };

  useEffect(() => {
    setLoggedIn(!!getUsername());
    fetchBalance();
  }, []);

  // Listen for both credit changes and login events
  useEffect(() => {
    const refresh = () => {
      setLoggedIn(!!getUsername());
      fetchBalance();
    };
    window.addEventListener('credits-changed', refresh);
    window.addEventListener('login-changed', refresh);
    return () => {
      window.removeEventListener('credits-changed', refresh);
      window.removeEventListener('login-changed', refresh);
    };
  }, []);

  // Refresh after payment return
  useEffect(() => {
    if (window.location.search.includes('success=1')) {
      fetchBalance();
    }
  }, []);

  // For anonymous users, show a registration prompt instead of "0 credits"
  if (!loggedIn) {
    return (
      <a
        href="/pricing"
        className="text-xs rounded-full px-3 py-1.5 font-medium transition-all" style={{color:'#4F8BFF', background:'rgba(79,139,255,0.08)', border:'1px solid rgba(79,139,255,0.15)', backdropFilter:'blur(8px)'}}
      >
        注册送 30 积分
      </a>
    );
  }

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
