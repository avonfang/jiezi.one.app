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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // Reset payment state when switching to a different plan
    setPaymentState('idle');
    setQrCodeUrl(null);
    setQrDataUrl(null);
    setOrderId(null);
    setError('');
  };

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
          <div className="rounded-xl p-8 text-center liquid-glass glass-sm">
            <div className="w-10 h-10 rounded-full border-2 animate-spin mx-auto mb-4" style={{borderColor:'rgba(79,139,255,0.15)', borderTopColor:'#4F8BFF'}} />
            <p className="text-gray-600">正在创建支付订单...</p>
          </div>
        );
      case 'qr':
        return (
          <div className="rounded-2xl overflow-hidden liquid-glass" style={{padding:0}}>
            <div className="gradient-primary px-6 py-5 text-center text-white">
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
                      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color:'#4F8BFF'}}>
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
                  <div className="w-52 h-52 mx-auto rounded-xl p-3 mb-4 liquid-glass" style={{padding:'8px'}}>
                    <img src={qrDataUrl} alt="支付二维码" className="w-full h-full" style={{borderRadius:'8px'}} />
                  </div>
                ) : (
                  <div className="w-52 h-52 mx-auto rounded-xl flex items-center justify-center mb-4" style={{background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
                    <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{borderColor:'rgba(79,139,255,0.15)', borderTopColor:'#4F8BFF'}} />
                  </div>
                )}
                <p className="text-xs text-gray-400 mb-4">二维码有效期 2 小时</p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{background:'#4F8BFF'}} />
                  等待支付中...
                </div>
              </div>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="rounded-2xl p-8 text-center liquid-glass glass-lg">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'rgba(79,139,255,0.08)'}}>
              <svg className="w-7 h-7" fill="none" stroke="#4F8BFF" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">支付成功</h2>
            <p className="text-sm mb-2" style={{color:'#4F8BFF'}}>积分已到账，现在可以开始验证产品想法了</p>
            {balance !== null && (
              <p className="text-sm text-gray-500 mb-6">当前剩余 <strong>{balance}</strong> 积分</p>
            )}
            <div className="flex items-center justify-center gap-3">
              <a href="/" className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98]" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                开始验证
              </a>
              <button onClick={handleReset} className="rounded-xl px-6 py-2.5 text-sm font-medium text-gray-600 active:scale-[0.98] transition-all" style={{border:'1px solid rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.3)'}}>
                继续购买
              </button>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="rounded-xl p-6 text-center" style={{background:'rgba(255,69,58,0.06)', border:'1px solid rgba(255,69,58,0.15)'}}>
            <p className="font-medium mb-2" style={{color:'#FF453A'}}>支付创建失败</p>
            <p className="text-sm mb-4" style={{color:'rgba(255,69,58,0.7)'}}>{error}</p>
            <button onClick={() => setPaymentState('idle')} className="rounded-lg px-6 py-2 text-sm font-medium transition-colors" style={{border:'1px solid rgba(255,69,58,0.2)', color:'#FF453A', background:'rgba(255,69,58,0.04)'}}>
              重新选择
            </button>
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen" style={{background:'var(--bg-gradient)'}}>
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
          <div className="rounded-xl p-4 text-center mb-8 max-w-md mx-auto liquid-glass glass-sm">
            <p style={{color:'#4F8BFF'}}>你还有 <strong>{balance}</strong> 积分</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          {PLANS.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`rounded-xl p-5 transition-all cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-[#4F8BFF] shadow-lg'
                    : 'shadow-sm hover:shadow-md'
                }`}
                style={isSelected ? {
                  background: 'linear-gradient(135deg, rgba(79,139,255,0.06), rgba(124,108,240,0.04))',
                  border: '1px solid rgba(79,139,255,0.3)',
                  backdropFilter: 'blur(28px) saturate(160%) contrast(1.02)',
                  boxShadow: 'inset 0 1.5px 0 rgba(79,139,255,0.15), 0 8px 40px rgba(79,139,255,0.10), 0 2px 8px rgba(0,0,0,0.03)',
                } : {
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(28px) saturate(160%) contrast(1.02)',
                  boxShadow: 'var(--glass-shadow)',
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 gradient-primary text-white text-[10px] font-semibold px-3 py-0.5 rounded-full shadow-sm z-10">
                    推荐
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full gradient-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-center pt-1">
                  <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{plan.price}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{plan.credits}</p>
                  <p className="text-xs font-medium mt-0.5" style={{color:'#4F8BFF'}}>{plan.unit_price}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-50">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{color:'#4F8BFF'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartPayment(plan.id); }}
                  className={`w-full mt-4 rounded-xl py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                    plan.popular
                      ? 'gradient-primary text-white shadow-sm'
                      : 'border text-gray-600'
                  }`} style={plan.popular ? {boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'} : {borderColor:'rgba(255,255,255,0.3)', background:'rgba(255,255,255,0.3)'}}
                >
                  立即购买
                </button>
              </div>
            );
          })}
        </div>

        {/* 积分加油包 */}
        <div className="max-w-lg mx-auto mb-8">
          <div className="rounded-xl p-5 liquid-glass">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg" style={{filter:'drop-shadow(0 1px 2px rgba(79,139,255,0.2))'}}>⚡</span>
              <h3 className="text-base font-semibold text-gray-900">积分加油包</h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{color:'#4F8BFF', background:'rgba(79,139,255,0.08)'}}>灵活补充</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'topup_small', price: '¥2.90', credits: '3 积分', unit: '¥0.97/积分', desc: '小份补充' },
                { id: 'topup_large', price: '¥3.90', credits: '5 积分', unit: '¥0.78/积分', desc: '大份更划算' },
              ].map(item => {
                const isSelected = selectedPlan === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectPlan(item.id)}
                    className={`rounded-xl p-4 text-center transition-all cursor-pointer relative ${
                      isSelected ? 'ring-2 ring-[#4F8BFF]' : ''
                    }`}
                    style={isSelected ? {
                      border: '1px solid rgba(79,139,255,0.3)',
                      background: 'linear-gradient(135deg, rgba(79,139,255,0.06), rgba(124,108,240,0.04))',
                      backdropFilter: 'blur(28px) saturate(160%) contrast(1.02)',
                      boxShadow: 'inset 0 1.5px 0 rgba(79,139,255,0.15), 0 4px 20px rgba(79,139,255,0.10)',
                    } : {
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full gradient-primary flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    <p className="text-2xl font-bold text-gray-900">{item.price}</p>
                    <p className="text-sm font-medium mt-1" style={{color:'#4F8BFF'}}>{item.credits}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.unit}</p>
                  </div>
                );
              })}
            </div>
            {selectedPlan?.startsWith('topup') && (
              <button
                onClick={() => handleStartPayment(selectedPlan!)}
                className="w-full mt-4 rounded-xl py-2.5 text-sm font-medium text-white gradient-primary transition-all active:scale-[0.98]"
                style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
              >
                确认支付
              </button>
            )}
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
