'use client';

import { useState } from 'react';
import type { ValidationReport } from '@/lib/types';

interface SummaryViewProps {
  report: ValidationReport;
  idea: string;
  onViewReport: () => void;
  onGeneratePrd?: () => void;
  prdLoading?: boolean;
  onPmConsult?: () => void;
  onReset: () => void;
}

const VERDICT_STYLES: Record<string, { gradient: string; icon: string; label: string }> = {
  '建议尝试': { gradient: 'from-emerald-500 to-green-500', icon: '🟢', label: '建议尝试' },
  '推荐做': { gradient: 'from-emerald-500 to-green-500', icon: '🟢', label: '建议尝试' },
  '值得探索': { gradient: 'from-amber-400 to-yellow-500', icon: '🟡', label: '值得探索' },
  '谨慎做': { gradient: 'from-amber-400 to-yellow-500', icon: '🟡', label: '值得探索' },
  '暂不建议': { gradient: 'from-red-400 to-rose-500', icon: '🔴', label: '暂不建议' },
  '不建议做': { gradient: 'from-red-400 to-rose-500', icon: '🔴', label: '暂不建议' },
};

function normalizedScore(...scores: number[]): number {
  const max = Math.max(...scores.filter(n => !isNaN(n)), 0);
  const avg = scores.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / scores.length;
  return max > 10 ? avg / 10 : avg;
}

export default function SummaryView({ report, idea, onViewReport, onGeneratePrd, prdLoading, onPmConsult, onReset }: SummaryViewProps) {
  const [cardLoading, setCardLoading] = useState(false);
  const vs = VERDICT_STYLES[report.verdict] || VERDICT_STYLES['值得探索'];
  const s = report.summary;
  const overallScore = normalizedScore(report.market_score, report.feasibility_score);

  const handleShareCard = async () => {
    setCardLoading(true);
    try {
      const res = await fetch('/api/share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          verdict: report.verdict,
          market_score: report.market_score,
          feasibility_score: report.feasibility_score,
          sharp_comment: report.sharp_comment,
          summary: report.summary,
        }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `芥子-${report.verdict}-卡片.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab with query params
      const q = new URLSearchParams({ idea, verdict: report.verdict, market_score: String(report.market_score || 0), feasibility_score: String(report.feasibility_score || 0) });
      if (report.summary?.one_liner) q.set('one_liner', report.summary.one_liner);
      window.open(`/api/share-card?${q.toString()}`, '_blank');
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Core summary card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Gradient top bar */}
        <div className={`h-2 bg-gradient-to-r ${vs.gradient}`} />

        <div className="p-6 sm:p-8">
          {/* Idea */}
          <div className="flex items-start gap-3 mb-6">
            <span className="text-lg shrink-0 mt-0.5">🌱</span>
            <div>
              <p className="text-[10px] text-gray-300 font-medium tracking-wider mb-1">芥子 · AI 产品验证</p>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">{idea}</p>
            </div>
          </div>

          {/* Verdict hero */}
          <div className={`bg-gradient-to-r ${vs.gradient} rounded-xl p-5 text-white mb-6`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{vs.icon}</span>
                  <span className="text-lg font-bold">{vs.label}</span>
                </div>
                <p className="text-sm text-white/80 leading-relaxed">{report.verdict_reason}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-3xl font-bold">{overallScore.toFixed(1)}</div>
                <div className="text-xs text-white/60">/10</div>
              </div>
            </div>
            {report.sharp_comment && (
              <div className="mt-3 pt-3 border-t border-white/20 flex items-start gap-2 text-sm text-white/90">
                <span className="shrink-0">💬</span>
                <span className="italic">{report.sharp_comment}</span>
              </div>
            )}
          </div>

          {/* 4 key metrics */}
          {s && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <MetricCard label="市场机会" value={s.market_opportunity} color="blue" />
              <MetricCard label="技术难度" value={s.tech_difficulty} color="purple" />
              <MetricCard label="启动成本" value={s.startup_cost} color="amber" />
              <MetricCard label="回本周期" value={s.payback_period} color="green" />
            </div>
          )}

          {/* Score breakdown */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <ScoreBar label="市场前景" score={report.market_score} />
            <ScoreBar label="开发可行性" score={report.feasibility_score} />
          </div>

          {/* One-liner */}
          {s?.one_liner && (
            <div className="bg-emerald-50/60 rounded-xl overflow-hidden mb-6">
              <div className="flex">
                <div className={`w-1 shrink-0 bg-gradient-to-b ${vs.gradient}`} />
                <div className="flex-1 px-5 py-4">
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-2">一句话总结</p>
                  <p className="text-base font-semibold text-gray-800 leading-relaxed">
                    &ldquo;{s.one_liner}&rdquo;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Data source badge */}
          <div className="flex items-center gap-3 text-xs text-gray-400 mb-6">
            {report.has_search_data && <span>🔍 含实时搜索数据</span>}
            <span>🤖 AI 分析</span>
            <span>|</span>
            <span>仅供参考</span>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-gray-100">
            <button
              onClick={onViewReport}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-medium text-white hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm"
            >
              查看完整报告
            </button>
            {onGeneratePrd && (
              <button
                onClick={onGeneratePrd}
                disabled={prdLoading}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                {prdLoading ? '生成中...' : '生成 PRD'}
                {!prdLoading && <span className="text-xs text-blue-200 font-normal">(⚡️消耗2积分)</span>}
              </button>
            )}
            {onPmConsult && (
              <button
                onClick={onPmConsult}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                追问深入分析
              </button>
            )}
            <button
              onClick={handleShareCard}
              disabled={cardLoading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {cardLoading ? '生成中...' : '分享卡片'}
            </button>
            <button
              onClick={onReset}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors ml-auto"
            >
              返回
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const gradients: Record<string, string> = {
    blue: 'from-blue-50 to-blue-50/50',
    purple: 'from-purple-50 to-purple-50/50',
    amber: 'from-amber-50 to-amber-50/50',
    green: 'from-green-50 to-green-50/50',
  };
  const textColors: Record<string, string> = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    green: 'text-green-400',
  };
  return (
    <div className={`bg-gradient-to-br ${gradients[color]} rounded-xl p-3 sm:p-4 text-center`}>
      <p className={`text-[10px] ${textColors[color]} font-medium uppercase tracking-wider mb-1`}>{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? 'bg-green-500' : score >= 4.5 ? 'bg-yellow-500' : 'bg-red-500';
  const bgColor = score >= 7 ? 'bg-green-100' : score >= 4.5 ? 'bg-yellow-100' : 'bg-red-100';
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-xl font-bold text-gray-800">{score}</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
      </div>
    </div>
  );
}
