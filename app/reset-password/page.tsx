'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!password || password.length < 4) {
      setError('密码至少 4 个字符');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '重置失败');
      setMessage(data.message || '密码已重置');
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '重置失败');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="px-6 pb-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-emerald-600 font-medium mb-4">{message}</p>
        <a
          href="/app/settings"
          className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          去登录
        </a>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="px-6 pb-6 text-center">
        <p className="text-sm text-red-500 mb-4">链接无效，请重新申请重置密码</p>
        <a
          href="/forgot-password"
          className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          重新申请
        </a>
      </div>
    );
  }

  return (
    <div className="px-6 pb-6 space-y-4">
      <div>
        <label className="block text-xs text-gray-500 mb-1">新密码</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="至少 4 个字符"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={!password || loading}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? '重置中...' : '重置密码'}
      </button>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">🔑</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">设置新密码</h2>
          <p className="text-xs text-gray-400 mt-1">输入你想使用的新密码</p>
        </div>

        <Suspense fallback={<div className="px-6 pb-6 text-center text-sm text-gray-400">加载中...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
