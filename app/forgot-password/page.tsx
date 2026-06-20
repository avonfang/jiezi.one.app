'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('请填写有效的邮箱地址');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '发送失败');
      setMessage(data.message || '重置邮件已发送');
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'var(--bg-gradient)'}}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(28px) saturate(160%) contrast(1.02)', border:'1px solid rgba(255,255,255,0.45)', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 8px 40px rgba(79,139,255,0.06), 0 2px 8px rgba(0,0,0,0.03)'}}>
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center mx-auto mb-3">
            <span className="text-lg">🌱</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">找回密码</h2>
          <p className="text-xs text-gray-400 mt-1">输入注册时填写的邮箱，我们将发送重置链接</p>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="输入注册邮箱"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={!email.trim() || loading}
            className="w-full rounded-xl gradient-primary py-2.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
          >
            {loading ? '发送中...' : '发送重置邮件'}
          </button>

          <div className="text-center space-y-2">
            <a href="/app/settings" className="block text-xs text-gray-400 hover:text-[#4F8BFF] transition-colors">
              返回登录
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
