'use client';

import { useState, useEffect } from 'react';
import { getClientId } from '@/lib/client-id';

const PLANS = [
  {
    id: 'single',
    name: '单次验证',
    price: '¥4.90',
    credits: '1 次验证',
    popular: false,
    desc: '试试芥子的验证能力',
  },
  {
    id: 'triple',
    name: '3 次套餐',
    price: '¥9.90',
    credits: '3 次验证',
    popular: true,
    desc: '验证多个想法，性价比之选',
  },
  {
    id: 'ten',
    name: '10 次套餐',
    price: '¥19.90',
    credits: '10 次验证',
    popular: false,
    desc: '重度用户首选，单次仅 ¥1.99',
  },
];

function RedeemCodeForm({ onRedeemed }: { onRedeemed: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleRedeem = async () => {
    if (code.trim().length < 4) return;
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), userId: getClientId() }),
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ ok: true, text: `兑换成功！获得 ${data.credits} 次验证次数 ✨` });
        setCode('');
        onRedeemed();
      } else {
        setMsg({ ok: false, text: data.error || '兑换失败' });
      }
    } catch {
      setMsg({ ok: false, text: '网络异常' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-2">
        <input
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="输入激活码（如 JZ-XXXX-XXXX）"
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 uppercase"
          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
        />
        <button
          onClick={handleRedeem}
          disabled={code.trim().length < 4 || loading}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '...' : '兑换'}
        </button>
      </div>
      {msg && (
        <p className={`text-sm mt-2 text-center ${msg.ok ? 'text-green-600' : 'text-red-500'}`}>{msg.text}</p>
      )}
    </div>
  );
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const userId = getClientId();
    if (userId) {
      fetch('/api/credits', { headers: { 'x-client-id': userId } })
        .then(r => r.json()).then(d => setBalance(d.balance)).catch(() => {});
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedPlan || transactionId.length < 4) return;
    setSubmitting(true);
    setError('');
    const userId = getClientId();
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, userId, transactionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '提交失败');
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-4">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-6">
            <span>🌱</span> 返回芥子
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">选择验证套餐</h1>
          <p className="text-gray-500">
            {balance !== null ? `当前剩余 ${balance} 次验证` : '按次付费，用完为止'}
          </p>
        </div>

        {/* Balance */}
        {balance !== null && balance > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center mb-8">
            <p className="text-blue-700">你还有 <strong>{balance}</strong> 次验证次数</p>
          </div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan.id); setSubmitted(false); setError(''); }}
              className={`bg-white rounded-xl border-2 p-6 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-400 shadow-lg shadow-blue-100'
                  : plan.popular ? 'border-gray-200' : 'border-gray-100'
              } hover:border-blue-300`}
            >
              {plan.popular && (
                <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-2">推荐</p>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
              <p className="text-sm text-gray-500 mt-1">{plan.credits}</p>
              <p className="text-xs text-gray-400 mt-2">{plan.desc}</p>
            </button>
          ))}
        </div>

        {/* Payment section */}
        {selectedPlan && !submitted && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">扫码支付</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-500 mb-3">
                请用微信 / 支付宝扫描下方二维码支付
                <span className="font-semibold text-gray-700"> {PLANS.find(p => p.id === selectedPlan)?.price}</span>
              </p>
              {/* QR Code placeholder */}
              <div className="w-48 h-48 mx-auto bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <img
                  src="/payment-qrcode.png"
                  alt="收款二维码"
                  className="w-44 h-44 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<p class="text-xs text-gray-400">请将你的<br>收款二维码<br>保存为<br>public/payment-qrcode.png</p>';
                  }}
                />
              </div>
            </div>

            {/* Transaction ID input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                交易单号后 4 位
              </label>
              <input
                value={transactionId}
                onChange={e => setTransactionId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="输入你支付账单中的单号后 4 位数字"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                方便我核对你的付款，在微信/支付宝账单里可以找到
              </p>
            </div>

            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={transactionId.length < 4 || submitting}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? '提交中...' : '我已付款，确认提交'}
            </button>
          </div>
        )}

        {/* Success */}
        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 max-w-md mx-auto text-center">
            <p className="text-green-700 font-medium mb-2">提交成功 ✨</p>
            <p className="text-sm text-green-600 mb-4">
              我核对到账后会为你充值，通常在几分钟内完成。
              <br />
              如有问题，可以再次提交或联系我。
            </p>
            <button
              onClick={() => { setSelectedPlan(null); setTransactionId(''); setSubmitted(false); }}
              className="rounded-lg border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              继续选择套餐
            </button>
          </div>
        )}

        {/* Activation code */}
        <div className="border-t border-gray-200 pt-8 mt-8">
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">已有激活码？</h2>
          <p className="text-sm text-gray-500 text-center mb-4">输入激活码，立即获得验证次数</p>
          <RedeemCodeForm onRedeemed={() => {
            const userId = getClientId();
            fetch('/api/credits', { headers: { 'x-client-id': userId } })
              .then(r => r.json()).then(d => setBalance(d.balance)).catch(() => {});
          }} />
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2 text-sm text-gray-400">
          <p>支付方式：微信 / 支付宝</p>
          <p>到账后立即可用，不限使用期限</p>
        </div>
      </div>
    </div>
  );
}
