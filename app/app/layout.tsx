'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getClientId, getUsername, isLoggedIn, logout } from '@/lib/client-id';

const NAV_ITEMS = [
  { href: '/app', label: '新建验证', icon: '✏️' },
  { href: '/app/history', label: '历史记录', icon: '📋' },
  { href: '/app/xumi', label: '须弥', icon: '🔮' },
  { href: '/app/contact', label: '联系我们', icon: '💬' },
  { href: '/app/settings', label: '我的', icon: '👤' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUserName(getUsername());
    refreshCredits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh credits
  const refreshCredits = useCallback(() => {
    const userId = getClientId();
    if (userId) {
      fetch('/api/credits', { headers: { 'x-client-id': userId } })
        .then(r => r.json())
        .then(d => setBalance(d.balance))
        .catch(() => {});
    }
  }, []);

  // Re-read username after login (when returning from settings)
  useEffect(() => {
    const check = () => setUserName(getUsername());
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  // Listen for credit changes
  useEffect(() => {
    window.addEventListener('credits-changed', refreshCredits);
    return () => window.removeEventListener('credits-changed', refreshCredits);
  }, [refreshCredits]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-52 bg-white border-r border-gray-100 flex flex-col shrink-0 transition-transform lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand — link to homepage */}
        <Link href="/" className="h-14 flex items-center gap-2 px-5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
          <span className="text-lg">🌱</span>
          <span className="font-semibold text-gray-900">芥子</span>
        </Link>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-4 py-4 border-t border-gray-100 space-y-3">
          {/* Credits */}
          {balance !== null && (
            <Link
              href="/pricing"
              className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <span className="text-gray-500">剩余</span>
              <span className="font-semibold text-gray-800">{balance} 积分</span>
            </Link>
          )}

          {/* User / Login */}
          {userName ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 truncate">{userName}</span>
              <button
                onClick={() => { logout(); window.location.href = '/app'; }}
                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/app/settings"
              onClick={() => setMobileOpen(false)}
              className="block text-center text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              登录 / 注册
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-30 lg:hidden w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Main content */}
      <main className="flex-1 min-w-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
