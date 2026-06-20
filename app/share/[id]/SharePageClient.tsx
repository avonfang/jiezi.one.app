'use client';

import { useEffect, useState } from 'react';
import type { ShareData, ValidationReport } from '@/lib/types';

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  '建议尝试': { bg: 'bg-green-50', text: 'text-green-700' },
  '推荐做': { bg: 'bg-green-50', text: 'text-green-700' },
  '值得探索': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  '谨慎做': { bg: 'bg-yellow-50', text: 'text-yellow-700' },
  '暂不建议': { bg: 'bg-red-50', text: 'text-red-700' },
  '不建议做': { bg: 'bg-red-50', text: 'text-red-700' },
};

const VERDICT_ICONS: Record<string, string> = {
  '建议尝试': '🟢',
  '推荐做': '🟢',
  '值得探索': '🟡',
  '谨慎做': '🟡',
  '暂不建议': '🔴',
  '不建议做': '🔴',
};

export default function SharePageClient({ id, initialData }: { id: string; initialData: ShareData | null }) {
  const [data, setData] = useState<ShareData | null>(initialData);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (data) return;
    fetch(`/api/share/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        else setError(res.error || '加载失败');
      })
      .catch(() => setError('网络异常'))
      .finally(() => setLoading(false));
  }, [id, data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-gradient)'}}>
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background:'var(--bg-gradient)'}}>
        <div className="text-center">
          <p className="text-gray-400 mb-2">😕</p>
          <p className="text-gray-500">{error || '内容不存在'}</p>
        </div>
      </div>
    );
  }

  const r = data.report;
  const c = VERDICT_COLORS[r.verdict] || VERDICT_COLORS['值得探索'];
  const icon = VERDICT_ICONS[r.verdict] || '🟡';

  return (
    <div className="min-h-screen" style={{background:'var(--bg-gradient)'}}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <span className="text-xs text-gray-300 mr-1">← 返回</span>
            <span>🌱</span> 芥子
          </a>
          <p className="text-xs text-gray-300 mt-2 italic">
            「芥子纳须弥」—— 一粒芥子容纳整座须弥山，一个小想法也能长成一个伟大的作品
          </p>
          <p className="text-[10px] text-gray-300 mt-6 mb-2">分享的验证报告</p>
        </div>

        {/* Summary Card */}
        {r.summary && <SummaryCard report={r} idea={data.idea} />}

        {/* Verdict */}
        <div className={`rounded-xl border-2 p-5 ${c.bg}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <p className={`text-xl font-bold ${c.text}`}>{r.verdict}</p>
              <p className="text-sm mt-1 text-gray-600">{r.verdict_reason}</p>
              {r.sharp_comment && (
                <div className="flex items-start gap-2 mt-3 text-sm">
                  <span className="text-amber-400 shrink-0">💬</span>
                  <span className="italic text-gray-500">{r.sharp_comment}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search evidence */}
        {r.competitors && r.competitors.length > 0 && (
          <div className="rounded-xl p-4 mt-4 mb-6 liquid-glass glass-sm">
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="#4F8BFF" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              AI 搜索发现 {r.competitors.length} 个相关产品
            </div>
            <div className="flex flex-wrap gap-2">
              {r.competitors.map((c, i) => (
                <div key={i} className="flex-1 min-w-[160px] rounded-lg p-3" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
                  <p className="text-sm font-medium text-gray-700">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.positioning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scores */}
        {(r.market_score || r.feasibility_score) && (
          <Section title="量化评分">
            <div className="grid grid-cols-2 gap-4">
              <ScoreBox label="市场前景" score={r.market_score} />
              <ScoreBox label="开发可行性" score={r.feasibility_score} />
            </div>
            {r.scoring && (
              <div className="mt-3 rounded-lg p-3" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 text-center">评分依据</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <ScoringItem label="市场规模" value={r.scoring.market_size} color="blue" />
                  <ScoringItem label="用户需求" value={r.scoring.user_demand} color="blue" />
                  <ScoringItem label="竞争密度" value={r.scoring.competition_density} color="blue" />
                  <ScoringItem label="付费潜力" value={r.scoring.monetization_potential} color="blue" />
                  <ScoringItem label="技术可行" value={r.scoring.tech_feasibility} color="indigo" />
                  <ScoringItem label="团队成本" value={r.scoring.team_cost} color="indigo" />
                </div>
              </div>
            )}
          </Section>
        )}

        {/* Market analysis */}
        <Section title="市场分析">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="竞品数量" value={r.market_analysis.competitor_count} />
            <StatCard label="市场需求" value={r.market_analysis.demand} />
            <StatCard label="竞争程度" value={r.market_analysis.competition_level} />
          </div>
        </Section>

        {/* SWOT */}
        {r.swot && (
          <Section title="SWOT 分析">
            <div className="grid grid-cols-2 gap-3">
              <SwotBox title="优势" items={r.swot.strengths} color="green" />
              <SwotBox title="劣势" items={r.swot.weaknesses} color="red" />
              <SwotBox title="机会" items={r.swot.opportunities} color="blue" />
              <SwotBox title="威胁" items={r.swot.threats} color="yellow" />
            </div>
          </Section>
        )}

        {/* Competitors */}
        {r.competitors.length > 0 && (
          <Section title="竞品列表">
            <div className="space-y-3">
              {r.competitors.map((c, i) => (
                <div key={i} className="rounded-lg p-3" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{c.positioning}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Simple text sections */}
        {r.differentiation && <Section title="差异化空间"><p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{r.differentiation}</p></Section>}
        {r.target_users && <Section title="目标用户"><p className="text-gray-700">{r.target_users}</p></Section>}
        {r.pricing_suggestion && <Section title="建议定价"><p className="text-gray-700">{r.pricing_suggestion}</p></Section>}
        {r.acquisition_channels && <Section title="获客渠道"><div className="rounded-lg p-4 text-sm leading-relaxed liquid-glass glass-sm" style={{color:'#1C1C1E'}}>{r.acquisition_channels}</div></Section>}
        {r.cost_budget && <Section title="成本预算"><div className="rounded-lg p-4 text-sm leading-relaxed" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>{r.cost_budget}</div></Section>}
        {r.revenue_estimation && <Section title="收入预估"><div className="rounded-lg p-4 text-sm leading-relaxed liquid-glass glass-sm">{r.revenue_estimation}</div></Section>}
        {r.tech_assessment && <Section title="技术实现评估"><div className="rounded-lg p-4 text-sm leading-relaxed liquid-glass glass-sm">{r.tech_assessment}</div></Section>}
        {r.mvp_timeline && <Section title="MVP 落地时间线"><div className="rounded-lg p-4 text-sm leading-relaxed liquid-glass glass-sm">{r.mvp_timeline}</div></Section>}
        {r.risk_warnings?.length > 0 && (
          <Section title="风险提示">
            <div className="space-y-2">
              {r.risk_warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* PRD link */}
        {data.prd && (
          <div className="rounded-xl p-5 text-center liquid-glass">
            <p className="text-sm text-gray-500 mb-3">该报告已生成产品需求文档（PRD）</p>
            <button
              onClick={() => window.location.href = `/share/${id}?view=prd`}
              className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98]" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
            >
              查看 PRD
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8 pt-6" style={{borderTop:'1px solid rgba(255,255,255,0.3)'}}>
          <a href="/" className="text-sm" style={{color:'#4F8BFF'}}>
            用芥子验证你的想法 →
          </a>
        </div>

        {/* Footer */}
        <div className="text-center text-xs mt-6 pt-4" style={{color:'rgba(0,0,0,0.25)', borderTop:'1px solid rgba(255,255,255,0.3)'}}>
          <p>芥子 · 「芥子纳须弥」—— 一粒芥子容纳整座须弥山</p>
          <p className="mt-1">由 AI 生成 · 所有分析仅供参考</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg p-3 text-center" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
  const barColor = score >= 7 ? '#34C759' : score >= 4.5 ? '#FF9F0A' : '#FF453A';
  return (
    <div className="rounded-lg p-4" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-2xl font-bold text-gray-800">{score}</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score * 10}%`, background: barColor }} />
      </div>
    </div>
  );
}

function ScoringItem({ label, value, color }: { label: string; value: number; color: string }) {
  const dots = '●'.repeat(Math.max(0, Math.min(5, value || 0))) + '○'.repeat(Math.max(0, 5 - Math.min(5, value || 0)));
  const colorClass = color === 'indigo' ? 'text-indigo-400' : 'text-blue-400';
  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs tracking-wider ${colorClass}`}>{dots}</p>
    </div>
  );
}

function normalizedScore(...scores: number[]): number {
  const max = Math.max(...scores.filter(n => !isNaN(n)), 0);
  const avg = scores.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / scores.length;
  return max > 10 ? avg / 10 : avg;
}

function SummaryCard({ report, idea }: { report: ValidationReport; idea: string }) {
  const s = report.summary;
  return (
    <div className="rounded-xl overflow-hidden mb-6 liquid-glass">
      <div className="h-1.5 bg-gradient-to-r from-[#4F8BFF] to-[#7C6CF0]" />
      <div className="p-6">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm">🌱</span>
          <span className="text-[10px] text-gray-300 font-medium tracking-wider">芥子 · AI 产品验证</span>
        </div>
        <p className="text-sm font-medium text-gray-800 leading-relaxed mb-4">{idea}</p>
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-medium text-gray-400">结论摘要</span>
          <div className="text-right">
            <span className="text-lg font-bold text-gray-800">{normalizedScore(report.market_score, report.feasibility_score).toFixed(1)}</span>
            <span className="text-xs text-gray-400 ml-0.5">/10</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider mb-1">市场机会</p>
            <p className="text-sm font-semibold text-gray-800">{s?.market_opportunity || '-'}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-purple-400 font-medium uppercase tracking-wider mb-1">技术难度</p>
            <p className="text-sm font-semibold text-gray-800">{s?.tech_difficulty || '-'}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider mb-1">启动成本</p>
            <p className="text-sm font-semibold text-gray-800">{s?.startup_cost || '-'}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-50/50 rounded-lg p-3 text-center">
            <p className="text-[10px] text-green-400 font-medium uppercase tracking-wider mb-1">回本周期</p>
            <p className="text-sm font-semibold text-gray-800">{s?.payback_period || '-'}</p>
          </div>
        </div>
        {s?.one_liner && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">一句话结论</p>
            <p className="text-sm text-gray-700 leading-relaxed italic">&ldquo;{s.one_liner}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
}

const SWOT_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: 'bg-green-50', text: 'text-green-700' },
  red: { bg: 'bg-red-50', text: 'text-red-700' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700' },
};

function SwotBox({ title, items, color }: { title: string; items: string[]; color: string }) {
  const c = SWOT_COLORS[color] || SWOT_COLORS.green;
  return (
    <div className={`${c.bg} border border-gray-100 rounded-lg p-3`}>
      <p className={`text-xs font-semibold ${c.text} mb-2 uppercase tracking-wider`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 leading-relaxed">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
