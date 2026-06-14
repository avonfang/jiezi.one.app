'use client';

import { useState } from 'react';

interface AuthModalProps {
  onClose: () => void;
  onAuth: (userId: string) => void;
  anonymousId: string;
}

type Mode = 'login' | 'register';

export default function AuthModal({ onClose, onAuth, anonymousId }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          anonymousId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '操作失败');

      // Save auth state
      localStorage.setItem('jiezi-username', username.trim());
      localStorage.setItem('jiezi-user-id', data.userId);
      onAuth(data.userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">🌱</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'login' ? '登录芥子' : '注册芥子'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {mode === 'login' ? '登录后可在不同设备使用' : '注册后匿名次数会自动合并'}
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">用户名</label>
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="输入用户名"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
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
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!username.trim() || !password || loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>

          <p className="text-center text-xs text-gray-400">
            {mode === 'login' ? (
              <>还没有账号？<button onClick={switchMode} className="text-blue-500 hover:text-blue-700">注册</button></>
            ) : (
              <>已有账号？<button onClick={switchMode} className="text-blue-500 hover:text-blue-700">登录</button></>
            )}
          </p>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full text-center text-xs text-gray-300 hover:text-gray-500 transition-colors"
          >
            继续匿名使用
          </button>
        </div>
      </div>
    </div>
  );
}
