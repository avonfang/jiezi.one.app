'use client';

import { useState, useEffect, useRef } from 'react';
import { getClientId, getAuthHeaders } from '@/lib/client-id';
import QRCode from 'qrcode';

const PLANS = [
  {
    id: 'basic',
    name: '体验装',
    price: '¥6.90',
    credits: '7 积分',
    unit_price: '¥0.99/积分',
    popular: false,
    features: [
      'AI 市场验证报告',
      '竞品实时搜索分析',
      'SWOT 分析',
      'PRD 文档生成',
      '产品预览页',
    ],
  },
  {
    id: 'standard',
    name: '标准装',
    price: '¥12.90',
    credits: '15 积分',
    unit_price: '¥0.86/积分',
    popular: true,
    features: [
      'AI 市场验证报告',
      '竞品实时搜索分析',
      'SWOT 分析',
      'PRD 文档生成',
      '产品预览页',
      '积分长期有效',
    ],
  },
  {
    id: 'premium',
    name: '畅享装',
    price: '¥29.90',
    credits: '35 积分',
    unit_price: '¥0.85/积分',
    popular: false,
    features: [
      'AI 市场验证报告',
      '竞品实时搜索分析',
      'SWOT 分析',
      'PRD 文档生成',
      '产品预览页',
      '积分长期有效',
      '优先生成速度',
    ],
  },
];

type PaymentState = 'idle' | 'creating' | 'qr' | 'success' | 'error';

const PAY_LABEL = '微信';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshBalance = () => {
    const userId = getClientId();
    if (!userId) return;
    fetch('/api/credits', { headers: { ...getAuthHeaders() } })
      .then(r => r.json()).then(d => setBalance(d.balance)).catch(() => {});
  };

  useEffect(refreshBalance, []);

  useEffect(() => {
    if (!qrCodeUrl) { setQrDataUrl(null); return; }
    QRCode.toDataURL(qrCodeUrl, { width: 260, margin: 2 })
      .then(url => setQrDataUrl(url))
      .catch(() => setQrDataUrl(null));
  }, [qrCodeUrl]);

  useEffect(() => {
    if (paymentState !== 'qr' || !orderId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/xorpay/query?order_id=${orderId}`);
        const data = await res.json();
        if (data.confirmed) {
          setPaymentState('success');
          refreshBalance();
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [paymentState, orderId]);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleStartPayment = async (planId?: string) => {
    const pid = planId || selectedPlan;
    if (!pid) return;
    setSelectedPlan(pid);
    setPaymentState('creating');
    setError('');

    try {
      const res = await fetch('/api/xorpay/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: pid, userId: getClientId(), payType: 'native' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || '创建支付失败');
      setOrderId(data.orderId);
      setQrCodeUrl(data.qrCode);
      setPaymentState('qr');
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建支付失败');
      setPaymentState('error');
    }
  };

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedPlan(null);
    setPaymentState('idle');
    setQrCodeUrl(null);
    setQrDataUrl(null);
    setOrderId(null);
    setError('');
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  const paymentView = (() => {
    if (!selectedPlan) return null;
    switch (paymentState) {
      case 'creating':
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-200 border-t-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">正在创建支付订单...</p>
          </div>
        );
      case 'qr':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-5 text-center text-white">
              <p className="text-sm font-medium text-white/80">{selectedPlanData?.name}</p>
              <p className="text-2xl font-bold mt-0.5">{selectedPlanData?.price}</p>
              <p className="text-xs text-white/60 mt-1">{selectedPlanData?.unit_price}</p>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">包含内容</p>
                <ul className="space-y-1.5">
                  {selectedPlanData?.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center border-t border-gray-50 pt-4">
                <p className="text-xs text-gray-400 mb-3">{selectedPlanData?.credits} · 付款后自动到账</p>
                {qrDataUrl ? (
                  <div className="w-52 h-52 mx-auto bg-white border border-gray-100 rounded-xl p-3 shadow-sm mb-4">
                    <img src={qrDataUrl} alt="支付二维码" className="w-full h-full" />
                  </div>
                ) : (
                  <div className="w-52 h-52 mx-auto bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center mb-4">
                    <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin" />
                  </div>
                )}
                <p className="text-xs text-gray-400 mb-4">二维码有效期 2 小时</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  等待支付中...
                </div>
              </div>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="bg-white border border-emerald-100 rounded-2xl p-8 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">支付成功</h2>
            <p className="text-sm text-emerald-600 mb-2">积分已到账，现在可以开始验证产品想法了</p>
            {balance !== null && (
              <p className="text-sm text-gray-500 mb-6">当前剩余 <strong>{balance}</strong> 积分</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <a href="/" className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-2.5 text-sm font-medium text-white hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm">
                开始验证
              </a>
              <button onClick={handleReset} className="rounded-lg border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                继续购买
              </button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium mb-2">支付创建失败</p>
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button onClick={() => setPaymentState('idle')} className="rounded-lg border border-red-300 px-6 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
              重新选择
            </button>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-4">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-8">
            ← 返回
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">选择积分套餐</h1>
          <p className="text-gray-500">
            {balance !== null ? `当前剩余 ${balance} 积分` : '按量付费，用完为止'}
          </p>
        </div>

        {balance !== null && balance > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center mb-8 max-w-md mx-auto">
            <p className="text-emerald-700">你还有 <strong>{balance}</strong> 积分</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-5 transition-all relative ${
                selectedPlan === plan.id
                  ? 'border-emerald-400 shadow-lg shadow-emerald-100'
                  : 'border-gray-100'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full shadow-sm">
                  推荐
                </div>
              )}
              <div className="text-center pt-1">
                <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
                <p className="text-sm text-gray-400 mt-0.5">{plan.credits}</p>
                <p className="text-xs text-emerald-500 font-medium mt-0.5">{plan.unit_price}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleStartPayment(plan.id)}
                className={`w-full mt-4 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 shadow-sm'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                立即购买
              </button>
            </div>
          ))}
        </div>

        {/* 积分加油包 */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="bg-white rounded-xl border-2 border-amber-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⛽</span>
              <h3 className="text-base font-semibold text-gray-900">积分加油包</h3>
              <span className="text-[10px] text-amber-500 font-medium bg-amber-50 px-2 py-0.5 rounded-full">灵活补充</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleStartPayment('topup_small')}
                className="border border-amber-200 rounded-xl p-4 text-center hover:bg-amber-50 transition-colors"
              >
                <p className="text-2xl font-bold text-gray-900">¥2.90</p>
                <p className="text-sm text-amber-600 font-medium mt-1">3 积分</p>
                <p className="text-[10px] text-gray-400 mt-0.5">¥0.97/积分</p>
              </button>
              <button
                onClick={() => handleStartPayment('topup_large')}
                className="border border-amber-300 bg-amber-50/30 rounded-xl p-4 text-center hover:bg-amber-50 transition-colors"
              >
                <p className="text-2xl font-bold text-gray-900">¥3.90</p>
                <p className="text-sm text-amber-600 font-medium mt-1">5 积分</p>
                <p className="text-[10px] text-gray-400 mt-0.5">¥0.78/积分</p>
              </button>
            </div>
          </div>
        </div>

        {selectedPlan && (
          <div className="max-w-sm mx-auto">
            {paymentView}
          </div>
        )}

      </div>
    </div>
  );
}
