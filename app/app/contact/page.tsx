'use client';

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{background:'var(--bg-gradient)'}}>
      <div className="max-w-lg mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg" style={{boxShadow:'0 4px 20px rgba(79,139,255,0.25)'}}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">加入「产品AI化」核心内测群</h1>
          <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
            与创造者同行，让想法更快落地
          </p>
        </div>

        {/* 你将获得 */}
        <div className="rounded-2xl p-6 mb-4 liquid-glass">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4F8BFF]" />
            你将获得
          </h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="text-lg shrink-0 mt-0.5">🚀</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">新功能首发权</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  代码脚手架、复杂逻辑分析等功能，群友提前 3 天体验。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg shrink-0 mt-0.5">💬</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">需求直通车</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  吐槽 Bug 或提建议，开发团队 24 小时内响应。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-lg shrink-0 mt-0.5">🎁</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">内测专属礼包</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  入群即送 10 积分，可用于生成完整 PRD。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 我们需要这样的你 */}
        <div className="rounded-2xl p-6 mb-6 liquid-glass">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            我们需要这样的你
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
              对 AI 赋能产品有浓厚兴趣的产品经理 / 开发者 / 创业者
            </li>
            <li className="flex items-start gap-2.5 text-sm text-gray-600">
              <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
              愿意分享使用体验，甚至容忍偶尔的小 Bug
            </li>
          </ul>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm text-center">
          <h2 className="text-base font-bold text-gray-900 mb-4">扫码加入内测群</h2>
          <div className="w-56 mx-auto rounded-xl overflow-hidden mb-3 liquid-glass" style={{maxHeight:'440px', padding:'4px'}}>
            <img src="/contact-qr.png" alt="内测群二维码" className="w-full h-full object-contain" />
          </div>
          <p className="text-xs text-gray-400">
            若二维码失效，请添加小助手微信：
            <span className="font-medium text-gray-600">yedu2024</span>
          </p>
        </div>

        {/* 客服联系方式 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            客服 &amp; 售后
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>微信小助手：<span className="font-medium text-gray-800">yedu2024</span></span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span>售后时间：工作日 10:00 - 19:00</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
}
