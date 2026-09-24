'use client';

import { useEffect } from 'react';
import { getAuthHeaders } from '@/lib/client-id';

// 访问统计：每次新会话（页面首次加载）上报一次，避免 SPA 内部导航重复计数。
export default function VisitTracker() {
  useEffect(() => {
    let counted = false;
    try {
      counted = sessionStorage.getItem('__v') === '1';
      if (!counted) sessionStorage.setItem('__v', '1');
    } catch {
      /* ignore */
    }
    if (counted) return;
    fetch('/api/track', { method: 'POST', headers: getAuthHeaders() }).catch(() => {});
  }, []);

  return null;
}
