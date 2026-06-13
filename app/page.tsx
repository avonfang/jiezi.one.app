'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import IdeaInput from '@/components/IdeaInput';
import LoadingState from '@/components/LoadingState';
import AuthModal from '@/components/AuthModal';
import CreditBadge from '@/components/CreditBadge';
import { getClientId, getUsername } from '@/lib/client-id';
import type { ValidationReport } from '@/lib/types';

const SAMPLE_IDEAS = [
  '我想做一个 AI 记账工具，自动分析微信和支付宝账单',
  '我想做一个帮留学生找室友的平台',
  '我想做一个 AI 模拟面试工具，帮程序员练习面试',
  '我想做一个 AI 育儿助手，记录宝宝喂奶和睡觉数据，给新手爸妈养育建议',
];

const verdictStyles: Record<string, string> = {
  '建议尝试': 'bg-green-100 text-green-700',
  '推荐做': 'bg-green-100 text-green-700',
  '值得探索': 'bg-yellow-100 text-yellow-700',
  '谨慎做': 'bg-yellow-100 text-yellow-700',
  '暂不建议': 'bg-red-100 text-red-700',
  '不建议做': 'bg-red-100 text-red-700',
};

function starRating(avg: number): string {
  const full = Math.round(avg / 2);
  return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(5 - full, 0));
}

function scoreColor(score: number) {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  return 'text-red-500';
}

export default function Home() {
  const router = useRouter();
  const [demoHtml, setDemoHtml] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [sampleIdea, setSampleIdea] = useState('');
  const [lastIdea, setLastIdea] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState('');
  const [loadingStage, setLoadingStage] = useState('extracting');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [recentRecords, setRecentRecords] = useState<{ id: string; idea: string; verdict: string; market_score: number; feasibility_score: number; target_users: string; report: ValidationReport; created_at: number }[]>([]);

  useEffect(() => {
    setUserName(getUsername());
  }, []);

  useEffect(() => {
    fetch('/demo.html')
      .then(res => res.text())
      .then(html => {
        if (html && html.length > 200) setDemoHtml(html);
      })
      .catch(() => {});
    fetch('/api/recent-validations?limit=6')
      .then(res => res.json())
      .then(data => setRecentRecords(data.records || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (text: string) => {
    setStatus('loading');
    setError('');
    setLoadingStage('extracting');
    setLastIdea(text);
    const clientId = getClientId();

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
        body: JSON.stringify({ idea: text }),
      });

      if (res.status === 402) {
        router.push('/pricing');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '验证失败');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);
            if (event.type === 'progress') {
              setLoadingStage(event.stage);
              setLoadingMessage(event.message || '');
            } else if (event.type === 'result') {
              setReport(event.report);
              setStatus('success');
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('credits')) {
        setError('积分不足，请购买套餐');
      } else if (msg.includes('timeout') || msg.includes('timed out')) {
        setError('AI 分析超时了，请稍后重试');
      } else if (msg.includes('fetch')) {
        setError('网络连接异常，请检查网络后重试');
      } else {
        setError(msg || '分析过程出现异常，请稍后重试');
      }
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setReport(null);
    setError('');
    setSampleIdea('');
  };

  const handleGoToApp = () => {
    if (report && lastIdea) {
      localStorage.setItem('jiezi-full-report', JSON.stringify({ idea: lastIdea, report }));
    }
    router.push('/app');
  };

  const handleViewRecent = (record: { idea: string; report: ValidationReport }) => {
    localStorage.setItem('jiezi-full-report', JSON.stringify({ idea: record.idea, report: record.report }));
    router.push('/app');
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-semibold text-gray-900">芥子</span>
          </div>
          <div className="flex items-center gap-2">
            {userName ? (
              <span className="text-xs text-gray-400 hidden sm:inline">{userName}</span>
            ) : (
              <button onClick={() => setShowAuth(true)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                登录
              </button>
            )}
            <CreditBadge />
          </div>
        </div>
      </header>

      {/* Auth modal */}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={() => {
            setShowAuth(false);
            setUserName(getUsername());
          }}
          anonymousId={getClientId()}
        />
      )}

      {/* Hero + 试试芥子 */}
      <section className="bg-gradient-to-b from-indigo-50/60 via-white to-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(99,102,241,0.06) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl animate-[float_10s_ease-in-out_infinite]" />
          <div className="absolute top-1/3 right-0 w-72 h-72 bg-blue-100/25 rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite_reverse]" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-indigo-100/20 rounded-full blur-3xl animate-[pulse-glow_6s_ease-in-out_infinite]" />
        </div>
        <div className="max-w-3xl mx-auto px-4 pt-16 sm:pt-20 pb-16 sm:pb-20 text-center relative animate-[fadeIn_0.6s_ease-out]">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            从想法
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">到产品方案，只需 1 分钟</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto mb-6 leading-relaxed">
            输入产品想法 → AI 自动验证市场方向、分析竞品、生成 PRD 和产品预览页
          </p>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mb-10 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              基于 AI + 实时搜索分析
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              分析真实市场数据与竞品
            </span>
          </div>

          {/* 试试芥子 */}
          <div className="max-w-2xl mx-auto">
            {status === 'idle' && (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    试试芥子
                  </h2>
                  <p className="text-gray-500">
                    输入一个产品想法，看看 AI 会给你什么建议
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {SAMPLE_IDEAS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setSampleIdea(s)}
                      className="text-xs text-gray-500 bg-white hover:bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5 transition-colors"
                    >
                      {s.length > 26 ? s.substring(0, 24) + '...' : s}
                    </button>
                  ))}
                </div>
                <IdeaInput onSubmit={handleSubmit} disabled={false} sampleIdea={sampleIdea} />
                <div className="mt-6 text-xs text-gray-400 leading-relaxed">
                  AI 将为你生成：<br />
                  市场验证报告 · SWOT 分析 · 产品需求文档（PRD） · 产品预览页
                </div>
              </>
            )}

            {/* Loading */}
            {status === 'loading' && <LoadingState stage={loadingStage} message={loadingMessage} />}

            {/* Error */}
            {status === 'error' && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600">{error}</p>
                    <button onClick={handleReset} className="text-sm text-red-500 hover:text-red-700 font-medium ml-4 whitespace-nowrap">
                      重试
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Result */}
            {status === 'success' && report && (
              <div className="text-left animate-[fadeIn_0.4s_ease-out]">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">验证报告</h2>
                  <p className="text-sm text-gray-400">AI 分析结果仅供参考，建议结合你的判断做最终决策</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${verdictStyles[report.verdict] || ''}`}>
                        {report.verdict}
                      </span>
                      <span className="text-sm text-amber-500 tracking-wider">
                        {starRating((report.market_score + report.feasibility_score) / 2)}
                      </span>
                      <span className="text-xs text-gray-400">{report.verdict_reason}</span>
                    </div>
                  </div>

                  {/* Sharp comment */}
                  {report.sharp_comment && (
                    <div className="px-5 py-3 border-b border-gray-50">
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-amber-400 shrink-0 mt-0.5">💬</span>
                        <span className="text-gray-500 italic leading-relaxed">{report.sharp_comment}</span>
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-3 border-b border-gray-50 flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-400">市场</span>{' '}
                      <span className={`font-semibold ${scoreColor(report.market_score)}`}>{report.market_score}/10</span>
                    </div>
                    <div>
                      <span className="text-gray-400">可行</span>{' '}
                      <span className={`font-semibold ${scoreColor(report.feasibility_score)}`}>{report.feasibility_score}/10</span>
                    </div>
                    <div>
                      <span className="text-gray-400">竞争</span>{' '}
                      <span className="font-semibold text-gray-700">{report.market_analysis.competition_level}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">需求</span>{' '}
                      <span className="font-semibold text-gray-700">{report.market_analysis.demand}</span>
                    </div>
                  </div>

                  {/* Search evidence */}
                  {report.competitors && report.competitors.length > 0 && (
                    <div className="px-5 py-3 border-b border-gray-50">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        AI 搜索发现 {report.competitors.length} 个相关产品
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {report.competitors.slice(0, 4).map((c, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-500 rounded-md px-2 py-1">
                            <span className="w-1 h-1 rounded-full bg-blue-300" />
                            {c.name}
                          </span>
                        ))}
                        {report.competitors.length > 4 && (
                          <span className="text-xs text-gray-300 self-center">+{report.competitors.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="px-5 py-4 space-y-2">
                    {report.swot.strengths.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-green-500 mt-0.5 shrink-0">▸</span>
                        <span>{s}</span>
                      </div>
                    ))}
                    {report.swot.opportunities.slice(0, 1).map((o, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-500 mt-0.5 shrink-0">▸</span>
                        <span>{o}</span>
                      </div>
                    ))}
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-purple-500 mt-0.5 shrink-0">▸</span>
                      <span>目标用户：{report.target_users}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex gap-3">
                      <button
                        onClick={handleReset}
                        className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        重新开始
                      </button>
                      <button
                        onClick={handleGoToApp}
                        className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                      >
                        查看完整报告 →
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-300 mt-2 leading-relaxed">
                      查看完整报告 · SWOT / PRD / 产品预览页
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Demo — shown only when idle */}
          {demoHtml && status === 'idle' && (
            <div className="max-w-3xl mx-auto mt-16 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm text-left">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <span className="ml-2 text-xs text-gray-400">芥子 — 产品演示</span>
              </div>
              <iframe
                srcDoc={demoHtml}
                className="w-full border-0"
                title="product-demo"
                style={{ height: '380px' }}
                sandbox="allow-scripts"
              />
            </div>
          )}

          {/* Recent validations — shown only when idle */}
          {status === 'idle' && recentRecords.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16 text-left">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                大家最近在验证的想法
              </h3>
              <div className="space-y-2">
                {recentRecords.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleViewRecent(r)}
                    className="w-full flex items-center justify-between bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm rounded-xl px-4 py-3 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-xs">
                        💡
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm text-gray-700 truncate block group-hover:text-gray-900">{r.idea}</span>
                        {r.report?.competitors?.length > 0 && (
                          <span className="text-[10px] text-gray-300 mt-0.5 block">
                            🔍 发现 {r.report.competitors.length} 个相关产品
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-3 ml-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.verdict === '建议尝试' || r.verdict === '推荐做' ? 'bg-green-50 text-green-600' :
                        r.verdict === '值得探索' || r.verdict === '谨慎做' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-red-50 text-red-600'
                      }`}>{r.verdict}</span>
                      <svg className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {status === 'idle' && (
        <footer className="border-t border-gray-100 bg-gray-50/30">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-lg">🌱</span>
              <span className="font-semibold text-gray-900">芥子</span>
            </div>
            <div className="text-xs text-gray-400">
              AI 产品想法验证器 · 用 AI 帮你判断哪些方向值得做
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-300">
              &copy; {new Date().getFullYear()} 芥子
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
