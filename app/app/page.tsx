'use client';

import { useState, useRef, useEffect } from 'react';
import IdeaInput from '@/components/IdeaInput';
import LoadingState from '@/components/LoadingState';
import ReportView from '@/components/ReportView';
import PRDView from '@/components/PRDView';
import PreviewView from '@/components/PreviewView';
import PMConsultView from '@/components/PMConsultView';
import HistoryPanel from '@/components/HistoryPanel';
import CreditBadge from '@/components/CreditBadge';
import AuthModal from '@/components/AuthModal';
import { getClientId, getUsername } from '@/lib/client-id';
import type { ValidationReport, PRD, PreviewPage, AppStatus, HistoryItem } from '@/lib/types';

const SAMPLE_IDEAS = [
  '我想做一个 AI 记账工具，自动分析微信和支付宝账单',
  '我想做一个帮留学生找室友的平台',
  '我想做一个 AI 模拟面试工具，帮程序员练习面试',
  '我想做一个 AI 育儿助手，记录宝宝喂奶和睡觉数据，给新手爸妈养育建议',
];

export default function AppPage() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [idea, setIdea] = useState('');
  const [sampleIdea, setSampleIdea] = useState('');
  const [error, setError] = useState('');
  const [prd, setPrd] = useState<PRD | null>(null);
  const [prdLoading, setPrdLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPMConsult, setShowPMConsult] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [loadingStage, setLoadingStage] = useState('extracting');
  const [streamTokens, setStreamTokens] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [prdProgress, setPrdProgress] = useState('');
  const [previewProgress, setPreviewProgress] = useState('');
  const [stalled, setStalled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setUserName(getUsername());
    // Restore report from homepage
    const saved = localStorage.getItem('jiezi-full-report');
    if (saved) {
      try {
        const { idea: savedIdea, report: savedReport } = JSON.parse(saved);
        if (savedIdea && savedReport) {
          setIdea(savedIdea);
          setReport(savedReport);
          setStatus('success');
          localStorage.removeItem('jiezi-full-report');
        }
      } catch { /* ignore */ }
    }
  }, []);
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('jiezi-history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jiezi-history', JSON.stringify(history));
    } catch { /* ignore */ }
  }, [history]);

  // Track when PRD/Preview generation stalls (no progress update for 5+ seconds)
  useEffect(() => {
    if (!prdLoading && !previewLoading) {
      setStalled(false);
      return;
    }
    setStalled(false);
    const timer = setTimeout(() => setStalled(true), 5000);
    return () => clearTimeout(timer);
  }, [prdLoading, previewLoading, prdProgress, previewProgress]);

  // Save to history when validation succeeds
  const saveToHistory = (reportData: ValidationReport) => {
    setHistory(prev => {
      const existing = prev.findIndex(h => h.idea === idea);
      const item: HistoryItem = {
        id: existing >= 0 ? prev[existing].id : Date.now().toString(36),
        idea,
        timestamp: Date.now(),
        report: reportData,
        prd: existing >= 0 ? prev[existing].prd : undefined,
        preview: existing >= 0 ? prev[existing].preview : undefined,
      };
      const next = [...prev];
      if (existing >= 0) next[existing] = item;
      else next.push(item);
      return next.slice(-20);
    });
  };

  // Update history when PRD is generated
  useEffect(() => {
    if (!prd) return;
    setHistory(prev => prev.map(h => h.idea === idea ? { ...h, prd, timestamp: Date.now() } : h));
  }, [prd]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update history when preview is generated
  useEffect(() => {
    if (!preview) return;
    setHistory(prev => prev.map(h => h.idea === idea ? { ...h, preview, timestamp: Date.now() } : h));
  }, [preview]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = (item: HistoryItem) => {
    setIdea(item.idea);
    setReport(item.report);
    setPrd(item.prd || null);
    setPreview(item.preview || null);
    setStatus('success');
    setShowPMConsult(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleShare = async () => {
    if (!report) return;
    setSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, report, prd, preview }),
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

  const handleSubmit = async (text: string) => {
    setStatus('loading');
    setError('');
    setIdea(text);
    setLoadingStage('extracting');
    setStreamTokens('');
    const clientId = getClientId();

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-client-id': clientId },
        body: JSON.stringify({ idea: text }),
      });

      if (res.status === 402) {
        window.location.href = '/pricing';
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
            } else if (event.type === 'token') {
              setStreamTokens(prev => prev + event.text);
            } else if (event.type === 'result') {
              setReport(event.report);
              setStatus('success');
              saveToHistory(event.report);
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
      if (msg.includes('402') || msg.includes('credits')) {
        setError('积分不足，请购买套餐或兑换激活码');
      } else if (msg.includes('timeout') || msg.includes('timed out')) {
        setError('AI 分析超时了，DeepSeek 暂时繁忙，请稍后重试');
      } else if (msg.includes('fetch')) {
        setError('网络连接异常，请检查网络后重试');
      } else {
        setError(msg || '分析过程出现异常，请稍后重试');
      }
      setStatus('error');
    }
  };

  const handleGeneratePrd = async () => {
    if (!report) return;
    setPrdLoading(true);
    setPrdProgress('');

    try {
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, report }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'PRD 生成失败');
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
              setPrdProgress(event.message);
            } else if (event.type === 'result') {
              setPrd(event.prd);
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
      if (msg.includes('timeout') || msg.includes('timed out')) {
        setError('AI 生成超时了，DeepSeek 暂时繁忙，请稍后重试');
      } else if (msg.includes('fetch')) {
        setError('网络连接异常，请检查网络后重试');
      } else {
        setError(msg || 'PRD 生成失败，请稍后重试');
      }
    } finally {
      setPrdLoading(false);
      setPrdProgress('');
    }
  };

  const handleGeneratePreview = async () => {
    if (!prd) return;
    setPreviewLoading(true);
    setPreviewProgress('');

    try {
      const res = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || '预览页生成失败');
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
              setPreviewProgress(event.message);
            } else if (event.type === 'result') {
              setPreview(event.preview);
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
      if (msg.includes('timeout') || msg.includes('timed out')) {
        setError('AI 生成超时了，DeepSeek 暂时繁忙，请稍后重试');
      } else if (msg.includes('fetch')) {
        setError('网络连接异常，请检查网络后重试');
      } else {
        setError(msg || '预览页生成失败，请稍后重试');
      }
    } finally {
      setPreviewLoading(false);
      setPreviewProgress('');
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setReport(null);
    setPrd(null);
    setPreview(null);
    setError('');
    setSampleIdea('');
    setShowPMConsult(false);
  };

  const handleBackToReport = () => {
    setPrd(null);
    setPreview(null);
  };

  // Preview view
  if (preview) {
    return (
      <SimpleLayout>
        <PreviewView preview={preview} onBack={handleBackToReport} />
      </SimpleLayout>
    );
  }

  // PRD view
  if (prd) {
    return (
      <SimpleLayout loading={previewLoading} progress={previewProgress}>
        <PRDView
          prd={prd}
          onBack={handleBackToReport}
          onGeneratePreview={handleGeneratePreview}
          previewLoading={previewLoading}
          onShare={handleShare}
          sharing={sharing}
        />
      </SimpleLayout>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-semibold text-gray-900">芥子</span>
          </a>
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

      {/* Main content */}
      <section className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-16">
          {status === 'idle' && (
            <>
              <HistoryPanel items={history} onRestore={handleRestore} onDelete={handleDeleteHistory} />
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">继续你的产品验证</h2>
                <p className="text-gray-500">输入一个产品想法，获取完整验证报告、PRD 和产品预览</p>
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
              <div className="mt-6 text-xs text-gray-400 leading-relaxed text-center">
                AI 将为你生成：市场验证报告 · SWOT 分析 · 产品需求文档（PRD） · 产品预览页
              </div>
            </>
          )}

          {status === 'loading' && <LoadingState stage={loadingStage} />}

          {status === 'success' && report && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">验证报告</h2>
                <p className="text-sm text-gray-400">AI 分析结果仅供参考，建议结合你的判断做最终决策</p>
              </div>
              <ReportView
                report={report}
                onReset={handleReset}
                onGeneratePrd={handleGeneratePrd}
                prdLoading={prdLoading}
                onPmConsult={() => setShowPMConsult(v => !v)}
                pmConsultOpen={showPMConsult}
                onShare={handleShare}
                sharing={sharing}
              />
              {showPMConsult && (
                <div className="mt-6">
                  <PMConsultView idea={idea} report={report} />
                </div>
              )}
            </>
          )}

          {status === 'error' && (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-700 font-medium mb-1">生成被中断了</p>
              <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto leading-relaxed">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleReset} className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  重新开始
                </button>
                <button onClick={() => window.location.reload()} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                  刷新页面
                </button>
              </div>
              <p className="text-xs text-gray-300 mt-4">AI 服务偶有不稳定，刷新后重试一般可解决</p>
            </div>
          )}
        </div>
      </section>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-xl transition-all z-40"
          aria-label="回到顶部"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Share toast */}
      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          链接已复制，可以分享给朋友了 ✨
        </div>
      )}

      {/* Footer */}
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

      {/* Loading overlay for PRD / Preview generation */}
      {(prdLoading || previewLoading) && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center max-w-sm text-center">
            <div className="relative w-14 h-14 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" style={{ animationDuration: '0.8s' }} />
            </div>
            <p className="text-base font-medium text-gray-700">
              {prdLoading && (prdProgress || 'AI 正在生成 PRD...')}
              {previewLoading && (previewProgress || 'AI 正在生成预览页...')}
            </p>
            {(prdProgress || previewProgress) && (
              <p className="text-sm text-gray-400 mt-2">{prdProgress || previewProgress}</p>
            )}
            {stalled && (
              <p className="text-xs text-amber-500 mt-3 animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {prdLoading ? 'AI 正在深入思考，请耐心等待...' : 'AI 正在精心设计页面...'}
              </p>
            )}
            <div className="flex gap-1 mt-5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SimpleLayout({ children, loading, progress }: { children: React.ReactNode; loading?: boolean; progress?: string }) {
  const [showAuth, setShowAuth] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    setUserName(getUsername());
  }, []);

  useEffect(() => {
    if (!loading) {
      setStalled(false);
      return;
    }
    setStalled(false);
    const timer = setTimeout(() => setStalled(true), 5000);
    return () => clearTimeout(timer);
  }, [loading, progress]);

  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-semibold text-gray-900">芥子</span>
          </a>
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
      <div className="flex-1 flex flex-col px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">{children}</div>
      </div>
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center max-w-sm text-center">
            <div className="relative w-14 h-14 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" style={{ animationDuration: '0.8s' }} />
            </div>
            <p className="text-base font-medium text-gray-700">{progress || 'AI 正在生成预览页...'}</p>
            {progress && <p className="text-sm text-gray-400 mt-2">{progress}</p>}
            {stalled && (
              <p className="text-xs text-amber-500 mt-3 animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                AI 正在精心设计页面...
              </p>
            )}
            <div className="flex gap-1 mt-5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
