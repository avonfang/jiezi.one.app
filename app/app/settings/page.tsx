'use client';

import { useState, useEffect } from 'react';
import { getClientId, getUsername, logout, setAuthToken } from '@/lib/client-id';

type Mode = 'login' | 'register';

export default function SettingsPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setUserName(getUsername()); }, []);

  const handleSubmit = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: mode === 'register' ? name.trim() : undefined,
          anonymousId: getClientId(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');

      const displayName = data.name || email.trim().split('@')[0];
      localStorage.setItem('jiezi-username', displayName);
      localStorage.setItem('jiezi-user-id', data.userId);
      if (data.token) setAuthToken(data.token);
      setUserName(displayName);
      setError('');
      setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserName(null);
  };

  if (userName) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🌱</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">{userName}</h2>
          <p className="text-xs text-gray-400 mb-6">已登录</p>
          <a
            href="/app"
            className="block w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors mb-3"
          >
            返回验证
          </a>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">🌱</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? '登录芥子' : '注册芥子'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {mode === 'login' ? '登录后可在不同设备查看历史记录' : '注册后匿名次数会自动合并'}
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="输入邮箱"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="输入密码"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">昵称（可选）</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="输入昵称"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!email.trim() || !password || loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {mode === 'login' ? (
              <>还没有账号？<button onClick={() => { setMode('register'); setError(''); setName(''); }} className="text-emerald-600 hover:text-emerald-700">注册</button></>
            ) : (
              <>已有账号？<button onClick={() => { setMode('login'); setError(''); }} className="text-emerald-600 hover:text-emerald-700">登录</button></>
            )}
          </p>

          <div className="text-center space-y-2">
            {mode === 'login' && (
              <a href="/forgot-password" className="block text-xs text-gray-400 hover:text-emerald-600 transition-colors">
                忘记密码？
              </a>
            )}
            <a
              href="/app"
              className="block text-xs text-gray-300 hover:text-gray-500 transition-colors"
            >
              继续匿名使用
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
