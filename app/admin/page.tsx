'use client';

import { useEffect, useState } from 'react';

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

const PLAN_NAMES: Record<string, string> = {
  single: '单次验证',
  triple: '3 次套餐',
  ten: '10 次套餐',
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [genPlan, setGenPlan] = useState('triple');
  const [genCount, setGenCount] = useState(5);
  const [genResult, setGenResult] = useState<ActivationCode[] | null>(null);
  const [tab, setTab] = useState<'orders' | 'codes'>('codes');

  const loadOrders = () => {
    fetch('/api/orders/list').then(r => r.json()).then(d => setOrders(d.orders || []));
  };
  const loadCodes = () => {
    fetch('/api/codes/list').then(r => r.json()).then(d => setCodes(d.codes || []));
  };

  useEffect(() => { loadOrders(); loadCodes(); }, []);

  const handleConfirm = async (orderId: string) => {
    await fetch('/api/orders/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    loadOrders();
  };

  const handleGenerate = async () => {
    const res = await fetch('/api/codes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: genPlan, count: genCount }),
    });
    const data = await res.json();
    if (data.success) {
      setGenResult(data.codes);
      loadCodes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 mr-3">← 返回首页</a>
            <h1 className="text-xl font-bold text-gray-900 inline">管理后台</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTab('codes')} className={`text-sm px-3 py-1 rounded ${tab === 'codes' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>激活码</button>
            <button onClick={() => setTab('orders')} className={`text-sm px-3 py-1 rounded ${tab === 'orders' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>订单</button>
          </div>
        </div>

        {/* ====== Activation Codes Tab ====== */}
        {tab === 'codes' && (
          <>
            {/* Generate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
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
                <button onClick={handleGenerate} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  生成
                </button>
              </div>

              {/* Generation result */}
              {genResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-700 font-medium mb-2">已生成 {genResult.length} 个激活码：</p>
                  <div className="space-y-1">
                    {genResult.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <code className="bg-white px-2 py-1 rounded border border-green-100 font-mono text-green-800 select-all">{c.code}</code>
                        <span className="text-gray-500">{c.plan}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(c.code)}
                          className="text-xs text-blue-500 hover:text-blue-700"
                        >复制</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Code list */}
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                全部激活码（{codes.length}）
              </h2>
              {codes.length === 0 && (
                <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无激活码</p>
              )}
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
                      {c.redeemed_at && (
                        <span className="text-xs text-gray-400">
                          {new Date(c.redeemed_at).toLocaleString('zh-CN')}
                        </span>
                      )}
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
              {orders.filter(o => o.status === 'pending').length === 0 && (
                <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无待确认订单</p>
              )}
              <div className="space-y-2">
                {orders.filter(o => o.status === 'pending').map(order => (
                  <div key={order.id} className="bg-white border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{PLAN_NAMES[order.plan] || order.plan}</p>
                      <p className="text-sm text-gray-500">{order.price} · {order.credits} 次 · 单号尾号 {order.transaction_id}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString('zh-CN')}</p>
                    </div>
                    <button onClick={() => handleConfirm(order.id)} className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">确认到账</button>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">已确认（{orders.filter(o => o.status === 'confirmed').length}）</h2>
              {orders.filter(o => o.status === 'confirmed').length === 0 && (
                <p className="text-sm text-gray-400 bg-white rounded-lg p-6 text-center border border-gray-100">暂无已确认订单</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
