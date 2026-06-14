'use client';

import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
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

function normalizedScore(...scores: number[]): number {
  const max = Math.max(...scores.filter(n => !isNaN(n)), 0);
  const avg = scores.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / scores.length;
  // If scores appear to be on a 0-100 scale, normalize to 0-10
  return max > 10 ? avg / 10 : avg;
}

function ScoringItem({ label, value, color }: { label: string; value: number; color: string }) {
  const dots = '●'.repeat(Math.max(0, Math.min(5, value || 0))) + '○'.repeat(Math.max(0, 5 - Math.min(5, value || 0)));
  const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-blue-400';
  const tooltipText = value >= 4 ? '评分较高' : value >= 3 ? '评分中等' : '评分较低';
  return (
    <div className="text-center group relative">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs tracking-wider cursor-help ${colorClass}`}>{dots}</p>
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg bg-gray-800 text-white text-[10px] leading-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
        {value}/5 · {tooltipText}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

function estimatePercent(value: string | undefined, type: 'opportunity' | 'difficulty' | 'cost' | 'payback'): number {
  if (!value) return 50;
  if (type === 'opportunity') {
    if (value.includes('大')) return 80;
    if (value.includes('中')) return 55;
    if (value.includes('小')) return 25;
  }
  if (type === 'difficulty') {
    if (value.includes('高')) return 80;
    if (value.includes('中')) return 50;
    if (value.includes('低')) return 25;
  }
  if (type === 'cost') {
    const nums = value.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const avg = (parseInt(nums[0]) + parseInt(nums[1])) / 2;
      return Math.min(95, Math.max(5, (avg / 200) * 100));
    }
  }
  if (type === 'payback') {
    const nums = value.match(/\d+/g);
    if (nums && nums.length >= 2) {
      const avg = (parseInt(nums[0]) + parseInt(nums[1])) / 2;
      return Math.min(95, Math.max(5, (avg / 36) * 100));
    }
  }
  return 50;
}

function SummaryCard({ report, idea, starRating, verdictStyles }: {
  report: ValidationReport;
  idea: string;
  starRating: (avg: number) => string;
  verdictStyles: Record<string, string>;
}) {
  const s = report.summary;
  const totalScore = normalizedScore(report.market_score, report.feasibility_score);
  const scorePct = Math.min(100, Math.max(0, (totalScore / 10) * 100));
  const CIRC = 97.4;
  const starColor = totalScore >= 7 ? 'text-yellow-500' : totalScore >= 5 ? 'text-amber-500' : 'text-gray-300';
  const ringColor = totalScore >= 7 ? '#10b981' : totalScore >= 5 ? '#f59e0b' : '#9ca3af';

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Gradient accent strip */}
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

      <div className="p-6">
        {/* Brand + idea */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">🌱</span>
            <span className="text-[10px] text-gray-300 font-medium tracking-wider">芥子 · AI 产品验证</span>
          </div>
          <p className="text-sm font-medium text-gray-800 leading-relaxed line-clamp-2">{idea}</p>
        </div>

        {/* Top: verdict + rating */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${verdictStyles[report.verdict] || ''}`}>
              {report.verdict}
            </span>
            <span className={`text-sm tracking-wider ${starColor}`}>
              {starRating(totalScore)}
            </span>
          </div>
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={ringColor} strokeWidth="3"
                strokeDasharray={`${(scorePct / 100) * CIRC} ${CIRC}`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-gray-800">{totalScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* 4 Key metrics grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: '市场机会', key: 'market_opportunity', type: 'opportunity' as const, icon: '📈', bg: 'from-blue-50 to-blue-50/50', bar: 'bg-blue-400' },
            { label: '技术难度', key: 'tech_difficulty', type: 'difficulty' as const, icon: '⚙️', bg: 'from-purple-50 to-purple-50/50', bar: 'bg-purple-400' },
            { label: '启动成本', key: 'startup_cost', type: 'cost' as const, icon: '💰', bg: 'from-amber-50 to-amber-50/50', bar: 'bg-amber-400' },
            { label: '回本周期', key: 'payback_period', type: 'payback' as const, icon: '⏱️', bg: 'from-green-50 to-green-50/50', bar: 'bg-green-400' },
          ].map(m => {
            const val = s?.[m.key as keyof typeof s] as string | undefined;
            const pct = estimatePercent(val, m.type);
            return (
              <div key={m.key} className={`bg-gradient-to-br ${m.bg} rounded-lg p-3`}>
                <div className="flex items-center justify-center gap-1 mb-1.5">
                  <span className="text-xs">{m.icon}</span>
                  <span className="text-[10px] font-medium text-gray-500">{m.label}</span>
                </div>
                <p className="text-sm font-semibold text-gray-800 text-center mb-2">{val || '-'}</p>
                {/* Progress bar with pointer */}
                <div className="relative h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${m.bar} opacity-60`} style={{ width: `${pct}%` }} />
                  <div className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white ${m.bar} shadow-sm`}
                    style={{ left: `calc(${pct}% - 5px)` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* One-liner conclusion */}
        {s?.one_liner && (
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              一句话总结
            </h3>
            <div className="bg-emerald-50/60 rounded-lg overflow-hidden">
              <div className="flex">
                <div className="w-1 bg-emerald-400 shrink-0" />
                <div className="flex-1 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                    &ldquo;{s.one_liner}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [demoHtml, setDemoHtml] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [sampleIdea, setSampleIdea] = useState('');
  const [lastIdea, setLastIdea] = useState(() => {
    try {
      const saved = localStorage.getItem('jiezi-full-report');
      if (saved) return JSON.parse(saved).idea || '';
    } catch { /* ignore */ }
    return '';
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(() => {
    try {
      const saved = localStorage.getItem('jiezi-full-report');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.idea && parsed.report ? 'success' : 'idle';
      }
    } catch { /* ignore */ }
    return 'idle';
  });
  const [report, setReport] = useState<ValidationReport | null>(() => {
    try {
      const saved = localStorage.getItem('jiezi-full-report');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.report || null;
      }
    } catch { /* ignore */ }
    return null;
  });
  const [error, setError] = useState('');
  const [loadingStage, setLoadingStage] = useState('extracting');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [imgSaving, setImgSaving] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const fullReportRef = useRef<HTMLDivElement>(null);
  const [recentRecords, setRecentRecords] = useState<{ id: string; idea: string; verdict: string; market_score: number; feasibility_score: number; target_users: string; report: ValidationReport; created_at: number }[]>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShareMenu]);

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
    localStorage.removeItem('jiezi-full-report');
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

  const handleSaveImage = async () => {
    if (!fullReportRef.current) return;
    setImgSaving(true);
    try {
      const dataUrl = await toPng(fullReportRef.current, { backgroundColor: '#fff' });
      const link = document.createElement('a');
      link.download = `芥子-产品验证.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // fallback
    } finally {
      setImgSaving(false);
      setShowShareMenu(false);
    }
  };

  const handleShare = async () => {
    if (!report || !lastIdea) return;
    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: lastIdea, report }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const url = `${window.location.origin}/share/${data.id}`;
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      // fallback
    } finally {
      setSharing(false);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setReport(null);
    setError('');
    setSampleIdea('');
  };

  const handleGoToApp = async () => {
    if (!report || !lastIdea) return;

    const clientId = getClientId();
    const res = await fetch('/api/unlock-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
    });

    if (res.status === 402) {
      router.push('/pricing');
      return;
    }

    if (!res.ok) {
      // fallback: still allow navigation even if unlock fails
      localStorage.setItem('jiezi-full-report', JSON.stringify({ idea: lastIdea, report }));
      router.push('/app');
      return;
    }

    window.dispatchEvent(new CustomEvent('credits-changed'));
    localStorage.setItem('jiezi-full-report', JSON.stringify({ idea: lastIdea, report }));
    router.push('/app');
  };
  const handleViewRecent = async (record: { idea: string; report: ValidationReport }) => {
    const clientId = getClientId();
    const res = await fetch('/api/unlock-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
    });

    if (res.status === 402) {
      router.push('/pricing');
      return;
    }

    window.dispatchEvent(new CustomEvent('credits-changed'));
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
            <span className="hidden sm:inline text-sm text-gray-400 ml-1.5 max-w-[320px] leading-tight">
              芥子纳须弥，一个小想法里面也蕴藏着伟大的作品
            </span>
          </div>
          <div className="flex items-center gap-2">
            {userName ? (
              <span className="text-xs text-gray-400 hidden sm:inline">{userName}</span>
            ) : (
              <button onClick={() => setShowAuth(true)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                登录
              </button>
            )}
            <a href="/app/history" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">历史</a>
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
            从一句话想法
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">到可落地的产品原型，只需 1 分钟</span>
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

            {/* Result — Summary Card first */}
            {status === 'success' && report && (
              <div className="text-left animate-[fadeIn_0.4s_ease-out]">
                {/* Summary Card */}
                <SummaryCard report={report} idea={lastIdea} starRating={starRating} verdictStyles={verdictStyles} />

                {/* 核心结论概览 */}
                <div ref={fullReportRef} className="mt-8 pt-6 border-t border-gray-100">
                    <div className="text-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-1">核心结论概览</h2>
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

                      {/* AI 灵魂拷问 */}
                      {report.sharp_comment && (
                        <div className="mx-5 my-3 bg-amber-50 border border-amber-200/60 rounded-xl overflow-hidden">
                          <div className="flex">
                            <div className="w-1 bg-amber-400 shrink-0" />
                            <div className="flex-1 px-4 py-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="text-base">💡</span>
                                <span className="text-[10px] font-semibold text-amber-600 tracking-wider uppercase">AI 灵魂拷问</span>
                              </div>
                              <p className="text-sm text-amber-900 leading-relaxed">
                                {report.sharp_comment}
                              </p>
                            </div>
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

                      {/* Scoring breakdown */}
                      {report.scoring && (
                        <div className="px-5 py-3 border-b border-gray-50">
                          <p className="text-[10px] text-gray-300 uppercase tracking-wider mb-2">评分依据</p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            <ScoringItem label="市场规模" value={report.scoring.market_size} color="blue" />
                            <ScoringItem label="用户需求" value={report.scoring.user_demand} color="blue" />
                            <ScoringItem label="竞争密度" value={report.scoring.competition_density} color="blue" />
                            <ScoringItem label="付费潜力" value={report.scoring.monetization_potential} color="blue" />
                            <ScoringItem label="技术可行" value={report.scoring.tech_feasibility} color="indigo" />
                            <ScoringItem label="团队成本" value={report.scoring.team_cost} color="indigo" />
                          </div>
                        </div>
                      )}

                      {/* 竞品调研 */}
                      {report.competitors && report.competitors.length > 0 && (
                        <div className="px-5 py-3 border-b border-gray-50">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            AI 搜索发现 {report.competitors.length} 个相关产品
                          </div>
                          <div className="space-y-2">
                            {report.competitors.slice(0, 4).map((c, i) => (
                              <div key={i} className="flex items-start gap-2.5 bg-gray-50/70 rounded-lg px-3 py-2">
                                <span className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-800">{c.name}</span>
                                    {c.source_url && (
                                      <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-600 shrink-0" onClick={e => e.stopPropagation()}>
                                        ↗
                                      </a>
                                    )}
                                  </div>
                                  {c.positioning && (
                                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{c.positioning}</p>
                                  )}
                                  {c.user_feedback && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[10px] text-gray-400">💬</span>
                                      <span className="text-[10px] text-gray-400 leading-tight line-clamp-1">{c.user_feedback}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {report.competitors.length > 4 && (
                              <p className="text-[10px] text-gray-300 text-center pt-1">
                                还有 {report.competitors.length - 4} 个相关产品未展示
                              </p>
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
                        <div className="flex items-center justify-between gap-3">
                          {/* Reset */}
                          <button
                            onClick={handleReset}
                            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors shrink-0"
                          >
                            重新开始
                          </button>

                          {/* Actions group */}
                          <div className="flex items-center gap-3">
                            <div className="relative" ref={shareMenuRef}>
                              <button
                                onClick={() => setShowShareMenu(v => !v)}
                                disabled={sharing}
                                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                              >
                                {sharing ? '生成中...' : '分享'}
                              </button>
                              {showShareMenu && (
                                <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                                  <button
                                    onClick={handleShare}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    {shareCopied ? '已复制 ✓' : '复制分享链接'}
                                  </button>
                                  <button
                                    onClick={handleSaveImage}
                                    disabled={imgSaving}
                                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors border-t border-gray-100 whitespace-nowrap"
                                  >
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {imgSaving ? '生成中...' : '保存为图片'}
                                  </button>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={handleSaveImage}
                              disabled={imgSaving}
                              className="flex-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 transition-colors"
                            >
                              {imgSaving ? '生成中...' : '下载/导出报告'}
                            </button>
                            <button
                              onClick={handleGoToApp}
                              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                            >
                              解锁深度分析
                              <span className="text-xs text-blue-200 font-normal">(⚡️消耗2积分)</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-center text-[10px] text-gray-300 mt-2 leading-relaxed">
                          SWOT / PRD / 产品预览页
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Share toast */}
            {shareCopied && (
              <div className="mt-4 text-center text-sm text-green-600 animate-[fadeIn_0.3s_ease-out]">
                链接已复制，可以分享给朋友了 ✨
              </div>
            )}
          </div>

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
        </div>
      </section>

      {status === 'idle' && (
        <footer className="border-t border-gray-100 bg-gray-50/30">
          <div className="max-w-3xl mx-auto px-4 py-12 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <img src="/favicon.svg" alt="" className="w-6 h-6 rounded" />
              <span className="font-semibold text-gray-900">芥子</span>
            </div>
            <div className="text-xs text-gray-400">
              AI 产品想法验证器 · 用 AI 帮你判断哪些方向值得做
            </div>
            <div className="mt-4">
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                联系我们
              </a>
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
