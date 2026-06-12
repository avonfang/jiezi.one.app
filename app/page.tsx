'use client';

import { useState, useRef, useEffect } from 'react';
import IdeaInput from '@/components/IdeaInput';
import LoadingState from '@/components/LoadingState';
import ReportView from '@/components/ReportView';
import PRDView from '@/components/PRDView';
import PreviewView from '@/components/PreviewView';
import DemoView from '@/components/DemoView';
import PMConsultView from '@/components/PMConsultView';
import HistoryPanel from '@/components/HistoryPanel';
import CreditBadge from '@/components/CreditBadge';
import { getClientId } from '@/lib/client-id';
import type { ValidationReport, PRD, PreviewPage, AppStatus, HistoryItem } from '@/lib/types';

const SAMPLE_IDEAS = [
  '我想做一个 AI 记账本，自动识别微信和支付宝账单，帮我分析每月消费结构',
  '做一个面向新手爸妈的 AI 育儿助手，记录宝宝喂奶、睡觉、换尿布数据，给出养育建议',
  '我想做一个宠物社交平台，帮养猫养狗的人找到附近可以一起遛宠的朋友',
  '做一个 AI 面试模拟器，根据岗位描述生成面试题，模拟真实面试对话',
];

export default function Home() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [idea, setIdea] = useState('');
  const [sampleIdea, setSampleIdea] = useState('');
  const [error, setError] = useState('');
  const [prd, setPrd] = useState<PRD | null>(null);
  const [prdLoading, setPrdLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewPage | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [demoHtml, setDemoHtml] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [showPMConsult, setShowPMConsult] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [loadingStage, setLoadingStage] = useState('extracting');
  const [streamTokens, setStreamTokens] = useState('');

  // Load history from localStorage on mount
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
      // Keep max 20 items
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
      // fallback: copy URL manually
    } finally {
      setSharing(false);
    }
  };
  const inputRef = useRef<HTMLDivElement>(null);

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

      // Read NDJSON stream
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
      setError(e instanceof Error ? e.message : '网络异常，请稍后重试');
      setStatus('error');
    }
  };

  const handleGeneratePrd = async () => {
    if (!report) return;
    setPrdLoading(true);

    try {
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, report }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'PRD 生成失败');
      }

      setPrd(data.prd);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PRD 生成失败');
    } finally {
      setPrdLoading(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (!prd) return;
    setPreviewLoading(true);

    try {
      const res = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prd }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '预览页生成失败');
      }

      setPreview(data.preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : '预览页生成失败');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await fetch('/api/generate-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '演示生成失败');
      }

      setDemoHtml(data.html);
    } catch (e) {
      setError(e instanceof Error ? e.message : '演示生成失败');
    } finally {
      setDemoLoading(false);
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

  const handleBackToHome = () => {
    setDemoHtml(null);
    setError('');
  };

  // Demo view
  if (demoHtml) {
    return (
      <SimpleLayout>
        <DemoView html={demoHtml} onBack={handleBackToHome} />
      </SimpleLayout>
    );
  }

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
      <SimpleLayout>
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
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-semibold text-gray-900">芥子</span>
          </div>
          <CreditBadge />
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            把你的产品想法
            <br />
            <span className="text-blue-600">变成可执行的方案</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8 leading-relaxed">
            输入一个产品想法，AI 自动验证市场、分析竞品、生成 PRD 和产品预览页。
            <br />
            帮你判断哪些方向值得做，快速落地。
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-base font-medium text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
            >
              免费开始使用
            </button>
            <button
              onClick={handleGenerateDemo}
              disabled={demoLoading}
              className="rounded-xl border border-gray-300 px-8 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {demoLoading ? '生成中...' : '观看演示'}
            </button>
          </div>

          {/* Steps */}
          <div className="mt-16 grid grid-cols-3 gap-6 text-left">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">输入想法</h3>
              <p className="text-sm text-gray-500">用中文描述你的产品想法，几句话即可</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">AI验证分析</h3>
              <p className="text-sm text-gray-500">AI搜索竞品、分析市场，生成结构化报告</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">PRD + 预览</h3>
              <p className="text-sm text-gray-500">生成产品文档和可下载的产品预览页</p>
            </div>
          </div>
        </div>
      </section>

      {/* Input section */}
      <section ref={inputRef} className="border-t border-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          {status === 'idle' && (
            <>
              <HistoryPanel items={history} onRestore={handleRestore} onDelete={handleDeleteHistory} />
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
                    {s.length > 18 ? s.substring(0, 16) + '...' : s}
                  </button>
                ))}
              </div>
              <IdeaInput onSubmit={handleSubmit} disabled={false} sampleIdea={sampleIdea} />
            </>
          )}

          {status === 'loading' && <LoadingState stage={loadingStage} tokens={streamTokens} />}

          {status === 'success' && report && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  验证报告
                </h2>
                <p className="text-sm text-gray-400">
                  AI 分析结果仅供参考，建议结合你的判断做最终决策
                </p>
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
              <p className="text-red-500 mb-2">出错了</p>
              <p className="text-sm text-gray-500 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                重试
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Share toast */}
      {shareCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50 animate-bounce">
          链接已复制，可以分享给朋友了 ✨
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        芥子 · AI 产品想法验证器
      </footer>
    </main>
  );
}

function SimpleLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex-1 flex flex-col">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌱</span>
            <span className="font-semibold text-gray-900">芥子</span>
          </div>
          <CreditBadge />
        </div>
      </header>
      <div className="flex-1 flex flex-col px-4 py-12">
        <div className="max-w-4xl mx-auto w-full">{children}</div>
      </div>
    </main>
  );
}
