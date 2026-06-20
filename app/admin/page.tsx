'use client';

import { useEffect, useState, useCallback } from 'react';

function AdminLogin({ onLogin }: { onLogin: (password: string) => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        onLogin(pw);
      } else if (res.status === 429) {
        setError('尝试次数过多，请稍后重试');
      } else {
        setError('密码错误');
      }
    } catch {
      setError('验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-gradient)'}}>
      <div className="w-full max-w-sm p-8 rounded-xl" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(28px) saturate(160%) contrast(1.02)', border:'1px solid rgba(255,255,255,0.45)', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 8px 40px rgba(79,139,255,0.06), 0 2px 8px rgba(0,0,0,0.03)'}}>
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-gray-900">管理后台</h1>
          <p className="text-sm text-gray-500 mt-1">请输入密码</p>
        </div>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="密码"
          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 mb-3"
        />
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!pw || loading}
          className="w-full rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
        >
          {loading ? '验证中...' : '进入后台'}
        </button>
      </div>
    </div>
  );
}

interface Order {
  id: string;
  userId: string;
  plan: string;
  credits: number;
  price: string;
  transaction_id: string;
  status: 'pending' | 'confirmed';
  created_at: number;
  confirmed_at?: number;
}

interface ActivationCode {
  code: string;
  credits: number;
  plan: string;
  status: 'active' | 'redeemed';
  redeemed_by?: string;
  redeemed_at?: number;
  created_at: number;
}

interface FeedbackItem {
  id: string;
  type: string;
  content: string;
  contact: string;
  created_at: number;
}

interface RegisteredUser {
  email: string;
  userId: string;
  name: string;
  createdAt: number;
}

const PLAN_NAMES: Record<string, string> = {
  single: '1 积分',
  triple: '3 积分',
  ten: '10 积分',
};

type Tab = 'users' | 'codes' | 'orders' | 'feedback' | 'credits';

export default function AdminPage() {
  const [adminPassword, setAdminPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [genPlan, setGenPlan] = useState('triple');
  const [genCount, setGenCount] = useState(5);
  const [genResult, setGenResult] = useState<ActivationCode[] | null>(null);
  const [tab, setTab] = useState<Tab>('codes');

  // Credits lookup
  const [lookupUserId, setLookupUserId] = useState('');
  const [lookupResult, setLookupResult] = useState<{ userId: string; balance: number } | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupMsg, setLookupMsg] = useState('');

  const adminFetch = useCallback((url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
    });
  }, [adminPassword]);

  const loadOrders = useCallback(() => {
    adminFetch('/api/orders/list').then(r => r.json()).then(d => setOrders(d.orders || []));
  }, [adminFetch]);

  const loadCodes = useCallback(() => {
    adminFetch('/api/codes/list').then(r => r.json()).then(d => setCodes(d.codes || []));
  }, [adminFetch]);

  const loadFeedbacks = useCallback(() => {
    adminFetch('/api/admin/feedback').then(r => r.json()).then(d => setFeedbacks(d.feedbacks || []));
  }, [adminFetch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminFetch('/api/admin/users');
      const d = await res.json();
      setUsers(d.users || []);
    } finally {
      setUsersLoading(false);
    }
  }, [adminFetch]);

  const handleLogin = (password: string) => {
    setAdminPassword(password);
    setAuthed(true);
  };

  useEffect(() => {
    if (authed) {
      loadOrders(); loadCodes(); loadFeedbacks(); loadUsers();
    }
  }, [authed, loadOrders, loadCodes, loadFeedbacks, loadUsers]);

  const handleConfirm = async (orderId: string) => {
    await adminFetch('/api/orders/confirm', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
    loadOrders();
  };

  const handleGenerate = async () => {
    const res = await adminFetch('/api/codes/generate', {
      method: 'POST',
      body: JSON.stringify({ plan: genPlan, count: genCount }),
    });
    const data = await res.json();
    if (data.success) {
      setGenResult(data.codes);
      loadCodes();
    }
  };

  const handleLookup = async () => {
    const id = lookupUserId.trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupMsg('');
    setLookupResult(null);
    try {
      const res = await adminFetch('/api/admin/credits', {
        method: 'POST',
        body: JSON.stringify({ userId: id, action: 'lookup' }),
      });
      const data = await res.json();
      if (data.error) {
        setLookupMsg(data.error);
      } else {
        setLookupResult(data);
      }
    } catch {
      setLookupMsg('查询失败');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!lookupResult || !addAmount) return;
    const amount = parseInt(addAmount);
    if (isNaN(amount) || amount < 1) return;
    setLookupLoading(true);
    try {
      const res = await adminFetch('/api/admin/credits', {
        method: 'POST',
        body: JSON.stringify({ userId: lookupResult.userId, action: 'add', amount }),
      });
      const data = await res.json();
      if (data.success) {
        setLookupResult(data);
        setAddAmount('');
        setLookupMsg(`成功添加 ${amount} 次`);
      } else {
        setLookupMsg(data.error || '操作失败');
      }
    } catch {
      setLookupMsg('操作失败');
    } finally {
      setLookupLoading(false);
    }
  };

  if (!authed) return <AdminLogin onLogin={handleLogin} />;

  return (
    <div className="min-h-screen p-8" style={{background:'var(--bg-gradient)'}}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mr-3">← 返回首页</a>
            <h1 className="text-xl font-bold text-gray-900 inline">管理后台</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {([['users', '用户'], ['codes', '激活码'], ['orders', '订单'], ['feedback', '反馈'], ['credits', '用户次数']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`text-sm px-3 py-1 rounded-xl active:scale-[0.98] transition-all ${tab === key ? 'gradient-primary text-white' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ====== Users Tab ====== */}
        {tab === 'users' && (
          <div>
            <div className="rounded-xl p-5 mb-6" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(28px) saturate(160%) contrast(1.02)', border:'1px solid rgba(255,255,255,0.45)', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 8px 40px rgba(79,139,255,0.06), 0 2px 8px rgba(0,0,0,0.03)'}}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-gray-900">注册用户</h2>
                <span className="text-sm text-gray-500">共 {users.length} 人</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                数据来源：KV 存储 auth:users —— 仅包含通过邮箱注册的用户
              </p>
              {usersLoading ? (
                <p className="text-sm text-gray-400 py-4 text-center">加载中...</p>
              ) : users.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center border border-dashed border-gray-200 rounded-lg">暂无注册用户</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="pb-2 font-medium">邮箱</th>
                        <th className="pb-2 font-medium">昵称</th>
                        <th className="pb-2 font-medium">注册时间</th>
                        <th className="pb-2 font-medium">User ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u, i) => (
                        <tr key={i} className="border-b border-gray-50 text-gray-700">
                          <td className="py-2.5 pr-4">{u.email}</td>
                          <td className="py-2.5 pr-4">{u.name}</td>
                          <td className="py-2.5 pr-4 text-gray-400">{new Date(u.createdAt).toLocaleString('zh-CN')}</td>
                          <td className="py-2.5 text-gray-400 text-xs font-mono break-all max-w-[160px]">{u.userId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <button
              onClick={loadUsers}
              className="text-sm hover:text-[#4F8BFF] transition-colors" style={{color:'rgba(79,139,255,0.8)'}}
            >
              刷新
            </button>
          </div>
        )}

        {/* ====== Activation Codes Tab ====== */}
        {tab === 'codes' && (
          <>
            <div className="rounded-xl p-5 mb-6" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(28px) saturate(160%) contrast(1.02)', border:'1px solid rgba(255,255,255,0.45)', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 8px 40px rgba(79,139,255,0.06), 0 2px 8px rgba(0,0,0,0.03)'}}>
              <h2 className="font-semibold text-gray-900 mb-3">生成激活码</h2>
              <div className="flex items-end gap-3 flex-wrap">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">套餐</label>
                  <select value={genPlan} onChange={e => setGenPlan(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none">
                    <option value="single">单次验证（1 次）</option>
                    <option value="triple">3 次套餐</option>
                    <option value="ten">10 次套餐</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">数量</label>
                  <input type="number" min={1} max={50} value={genCount} onChange={e => setGenCount(parseInt(e.target.value) || 1)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-20 outline-none" />
                </div>
                <button onClick={handleGenerate} className="rounded-xl gradient-primary px-5 py-2 text-sm font-medium text-white active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                  生成
                </button>
              </div>
              {genResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium mb-2">已生成 {genResult.length} 个激活码：</p>
                  <div className="space-y-1">
                    {genResult.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <code className="bg-white px-2 py-1 rounded border border-green-100 font-mono text-green-800 select-all">{c.code}</code>
                        <span className="text-gray-500">{c.plan}</span>
                        <button onClick={() => navigator.clipboard.writeText(c.code)} className="text-xs text-blue-500 hover:text-blue-700">复制</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">全部激活码（{codes.length}）</h2>
              {codes.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无激活码</p>}
              <div className="space-y-1.5">
                {codes.map((c, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-gray-800">{c.code}</code>
                      <span className="text-gray-400 text-xs">{c.plan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {c.status === 'active'
                        ? <span className="text-xs text-green-600 font-medium">可用</span>
                        : <span className="text-xs text-gray-400">已使用</span>
                      }
                      {c.redeemed_at && <span className="text-xs text-gray-400">{new Date(c.redeemed_at).toLocaleString('zh-CN')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== Orders Tab ====== */}
        {tab === 'orders' && (
          <>
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">待确认（{orders.filter(o => o.status === 'pending').length}）</h2>
              {orders.filter(o => o.status === 'pending').length === 0 && <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无待确认订单</p>}
              <div className="space-y-2">
                {orders.filter(o => o.status === 'pending').map(order => (
                  <div key={order.id} className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{PLAN_NAMES[order.plan] || order.plan}</p>
                      <p className="text-sm text-gray-500">{order.price} · {order.credits} 次 · 单号尾号 {order.transaction_id}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString('zh-CN')} · <span className="font-mono text-xs">{order.userId}</span>
                      </div>
                    </div>
                    <button onClick={() => handleConfirm(order.id)} className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 active:scale-[0.98] transition-all">确认到账</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">已确认（{orders.filter(o => o.status === 'confirmed').length}）</h2>
              {orders.filter(o => o.status === 'confirmed').length === 0 && <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无已确认订单</p>}
              <div className="space-y-1.5">
                {orders.filter(o => o.status === 'confirmed').map(order => (
                  <div key={order.id} className="bg-white border border-gray-100 rounded-lg px-4 py-2.5 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{PLAN_NAMES[order.plan] || order.plan}</p>
                      <p className="text-xs text-gray-400">{order.price} · <span className="font-mono text-xs">{order.userId}</span> · {new Date(order.confirmed_at || order.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ====== Feedback Tab ====== */}
        {tab === 'feedback' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">用户反馈（{feedbacks.length}）</h2>
            {feedbacks.length === 0 && <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无反馈</p>}
            <div className="space-y-3">
              {feedbacks.map((f, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {f.type && <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 mb-2">{f.type}</span>}
                      <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{f.content}</p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">{new Date(f.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                  {f.contact && (
                    <p className="text-xs text-blue-500">联系方式：{f.contact}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====== Credits Management Tab ====== */}
        {tab === 'credits' && (
          <div className="space-y-6">
            <div className="rounded-xl p-5" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(28px) saturate(160%) contrast(1.02)', border:'1px solid rgba(255,255,255,0.45)', boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(255,255,255,0.15), 0 8px 40px rgba(79,139,255,0.06), 0 2px 8px rgba(0,0,0,0.03)'}}>
              <h2 className="font-semibold text-gray-900 mb-3">查询用户次数</h2>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs text-gray-500 mb-1">用户 ID</label>
                  <input
                    value={lookupUserId}
                    onChange={e => setLookupUserId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLookup()}
                    placeholder="输入用户 clientId"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <button onClick={handleLookup} disabled={!lookupUserId.trim() || lookupLoading} className="rounded-xl gradient-primary px-5 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                  {lookupLoading ? '查询中...' : '查询'}
                </button>
              </div>

              {lookupMsg && !lookupResult && (
                <p className="text-sm text-red-500 mt-3">{lookupMsg}</p>
              )}

              {lookupResult && (
                <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 break-all">用户 {lookupResult.userId}</p>
                      <p className="text-sm text-gray-500 mt-0.5">当前余额：<strong className="text-blue-700">{lookupResult.balance}</strong> 次</p>
                    </div>
                  </div>
                  <div className="flex items-end gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">增加次数</label>
                      <input
                        type="number"
                        min={1}
                        value={addAmount}
                        onChange={e => setAddAmount(e.target.value)}
                        placeholder="输入数量"
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-24 outline-none focus:border-blue-400"
                      />
                    </div>
                    <button onClick={handleAddCredits} disabled={!addAmount || lookupLoading} className="rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all">
                      增加
                    </button>
                  </div>
                  {lookupMsg && lookupResult && <p className="text-sm text-green-600 mt-2">{lookupMsg}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
