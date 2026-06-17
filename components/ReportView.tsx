'use client';

import { useState, useRef, useEffect } from 'react';
import type { ValidationReport } from '@/lib/types';

interface ReportViewProps {
  report: ValidationReport;
  idea?: string;
  onReset: () => void;
  onGeneratePrd?: () => void;
  prdLoading?: boolean;
  onPmConsult?: () => void;
  pmConsultOpen?: boolean;
  onShare?: () => void;
  sharing?: boolean;
  onViewPrd?: () => void;
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  '建议尝试': { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '建议尝试' },
  '推荐做': { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '建议尝试' },
  '值得探索': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: '值得探索' },
  '谨慎做': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: '值得探索' },
  '暂不建议': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '暂不建议' },
  '不建议做': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '暂不建议' },
};

const VERDICT_ICONS: Record<string, string> = {
  '建议尝试': '🟢',
  '推荐做': '🟢',
  '值得探索': '🟡',
  '谨慎做': '🟡',
  '暂不建议': '🔴',
  '不建议做': '🔴',
};

function starRating(avg: number): string {
  const full = Math.round(avg / 2);
  return '★'.repeat(Math.min(full, 5)) + '☆'.repeat(Math.max(5 - full, 0));
}

export default function ReportView({ report, idea, onReset, onGeneratePrd, prdLoading, onPmConsult, pmConsultOpen, onShare, sharing, onViewPrd }: ReportViewProps) {
  const [cardLoading, setCardLoading] = useState(false);
  const verdictStyle = VERDICT_STYLES[report.verdict] || VERDICT_STYLES['值得探索'];
  const verdictIcon = VERDICT_ICONS[report.verdict] || '🟡';

  const handleDownloadMarkdown = () => {
    const md = `# 产品验证报告

## 综合判断
${report.verdict} — ${report.verdict_reason}

## 量化评分
- 市场前景：${report.market_score}/10
- 开发可行性：${report.feasibility_score}/10

## 市场分析
- 竞品数量：${report.market_analysis.competitor_count}
- 市场需求：${report.market_analysis.demand}
- 竞争程度：${report.market_analysis.competition_level}

${report.swot ? `## SWOT 分析

**优势：**
${report.swot.strengths.map(s => `- ${s}`).join('\n')}

**劣势：**
${report.swot.weaknesses.map(s => `- ${s}`).join('\n')}

**机会：**
${report.swot.opportunities.map(s => `- ${s}`).join('\n')}

**威胁：**
${report.swot.threats.map(s => `- ${s}`).join('\n')}
` : ''}${report.competitors.length > 0 ? `## 竞品列表

${report.competitors.map(c => `- **${c.name}**：${c.positioning}${c.source_url ? `（[来源](${c.source_url})）` : ''}`).join('\n')}
` : ''}${report.differentiation ? `## 差异化空间
${report.differentiation}
` : ''}${report.target_users ? `## 目标用户
${report.target_users}
` : ''}${report.pricing_suggestion ? `## 定价建议
${report.pricing_suggestion}
` : ''}${report.acquisition_channels ? `## 获客渠道
${report.acquisition_channels}
` : ''}${report.cost_budget ? `## 成本预算
${report.cost_budget}
` : ''}${report.revenue_estimation ? `## 收入预估
${report.revenue_estimation}
` : ''}${report.tech_assessment ? `## 技术评估
${report.tech_assessment}
` : ''}${report.mvp_timeline ? `## MVP 时间线
${report.mvp_timeline}
` : ''}${report.risk_warnings?.length ? `## 风险提示
${report.risk_warnings.map(w => `- ⚠ ${w}`).join('\n')}
` : ''}
---
*报告由芥子 AI 生成，${report.has_search_data ? '部分数据基于 Brave Search 实时搜索结果，' : ''}所有分析仅供参考。*`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `验证报告-${report.verdict}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    if (showDownloadMenu) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDownloadMenu]);

  const handleDownloadPdf = () => {
    const sectionsHtml = `
<h2 style="color:#16a34a;margin:0 0 8px 0;font-size:18px;">综合判断</h2>
<p style="font-size:16px;font-weight:600;color:${['建议尝试','推荐做'].includes(report.verdict) ? '#16a34a' : ['值得探索','谨慎做'].includes(report.verdict) ? '#ca8a04' : '#dc2626'}">${report.verdict}</p>
<p style="color:#555;line-height:1.6;margin:4px 0 20px 0;">${report.verdict_reason}</p>

<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">量化评分</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
<tr><td style="padding:8px 12px;background:#f0fdf4;border:1px solid #dcfce7;font-weight:500;">市场前景</td><td style="padding:8px 12px;background:#f0fdf4;border:1px solid #dcfce7;">${report.market_score}/10</td></tr>
<tr><td style="padding:8px 12px;background:#fefce8;border:1px solid #fef9c3;font-weight:500;">开发可行性</td><td style="padding:8px 12px;background:#fefce8;border:1px solid #fef9c3;">${report.feasibility_score}/10</td></tr>
</table>

<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">市场分析</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:500;">竞品数量</td><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;">${report.market_analysis.competitor_count}</td></tr>
<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:500;">市场需求</td><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;">${report.market_analysis.demand}</td></tr>
<tr><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:500;">竞争程度</td><td style="padding:8px 12px;background:#f9fafb;border:1px solid #e5e7eb;">${report.market_analysis.competition_level}</td></tr>
</table>

${report.swot ? `
<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">SWOT 分析</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
<tr><td style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;vertical-align:top;width:50%;font-weight:600;color:#15803d;">优势</td><td style="padding:10px 12px;background:#f0fdf4;border:1px solid #bbf7d0;vertical-align:top;width:50%;font-weight:600;color:#991b1b;">劣势</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top;"><ul style="margin:0;padding-left:16px;">${report.swot.strengths.map(s => `<li style="margin:2px 0;">${s}</li>`).join('')}</ul></td>
<td style="padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top;"><ul style="margin:0;padding-left:16px;">${report.swot.weaknesses.map(s => `<li style="margin:2px 0;">${s}</li>`).join('')}</ul></td></tr>
<tr><td style="padding:10px 12px;background:#eff6ff;border:1px solid #bfdbfe;vertical-align:top;font-weight:600;color:#1d4ed8;">机会</td><td style="padding:10px 12px;background:#fefce8;border:1px solid #fde68a;vertical-align:top;font-weight:600;color:#a16207;">威胁</td></tr>
<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top;"><ul style="margin:0;padding-left:16px;">${report.swot.opportunities.map(s => `<li style="margin:2px 0;">${s}</li>`).join('')}</ul></td>
<td style="padding:8px 12px;border:1px solid #e5e7eb;vertical-align:top;"><ul style="margin:0;padding-left:16px;">${report.swot.threats.map(s => `<li style="margin:2px 0;">${s}</li>`).join('')}</ul></td></tr>
</table>` : ''}

${report.competitors.length > 0 ? `
<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">竞品列表</h2>
${report.competitors.map(c => `
<div style="padding:10px 12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:8px;">
<p style="margin:0 0 2px 0;font-weight:600;font-size:14px;">${c.name}</p>
<p style="margin:0 0 2px 0;color:#666;font-size:13px;">${c.positioning}</p>
${c.user_feedback ? `<p style="margin:0;color:#999;font-style:italic;font-size:12px;">${c.user_feedback}</p>` : ''}
${c.source_url ? `<p style="margin:4px 0 0 0;font-size:11px;color:#3b82f6;">来源：${c.source_url}</p>` : ''}
</div>`).join('')}` : ''}

${report.differentiation ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">差异化空间</h2><p style="color:#333;line-height:1.6;">${report.differentiation}</p>` : ''}
${report.target_users ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">目标用户</h2><p style="color:#333;line-height:1.6;">${report.target_users}</p>` : ''}
${report.pricing_suggestion ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">定价建议</h2><p style="color:#333;line-height:1.6;">${report.pricing_suggestion}</p>` : ''}
${report.acquisition_channels ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">获客渠道</h2><p style="color:#333;line-height:1.6;">${report.acquisition_channels}</p>` : ''}
${report.cost_budget ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">成本预算</h2><p style="color:#333;line-height:1.6;">${report.cost_budget}</p>` : ''}
${report.revenue_estimation ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">收入预估</h2><p style="color:#333;line-height:1.6;">${report.revenue_estimation}</p>` : ''}
${report.tech_assessment ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">技术评估</h2><p style="color:#333;line-height:1.6;">${report.tech_assessment}</p>` : ''}
${report.mvp_timeline ? `<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">MVP 时间线</h2><p style="color:#333;line-height:1.6;">${report.mvp_timeline}</p>` : ''}
${report.risk_warnings?.length ? `
<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">风险提示</h2>
<ul style="padding-left:16px;">${report.risk_warnings.map(w => `<li style="margin:4px 0;color:#555;">${w}</li>`).join('')}</ul>` : ''}`;

    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>产品验证报告 - ${report.verdict}</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans SC,PingFang SC,Helvetica Neue,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#333;line-height:1.6;}
h1{font-size:24px;color:#111;margin:0 0 4px 0;}h1 small{font-size:13px;color:#999;font-weight:400;}
.verdict{display:inline-block;padding:2px 10px;border-radius:4px;font-weight:600;font-size:14px;margin:8px 0;}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;}
@media print{body{max-width:none;margin:20px;}h2{break-after:avoid;}table,div{break-inside:avoid;}}
</style></head><body>
<h1>产品验证报告 <small>${new Date().toLocaleDateString('zh-CN')}</small></h1>
<div class="verdict" style="background:${['建议尝试','推荐做'].includes(report.verdict) ? '#dcfce7' : ['值得探索','谨慎做'].includes(report.verdict) ? '#fef9c3' : '#fee2e2'};color:${['建议尝试','推荐做'].includes(report.verdict) ? '#16a34a' : ['值得探索','谨慎做'].includes(report.verdict) ? '#a16207' : '#dc2626'}">${report.verdict}</div>
${sectionsHtml}
<div class="footer">由芥子 AI 生成 · ${report.has_search_data ? '部分数据基于 Brave Search 实时搜索结果 · ' : ''}所有分析仅供参考</div>
<script>window.print()</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printHtml);
      win.document.close();
    }
  };

  const handleShareCard = async () => {
    setCardLoading(true);
    try {
      const res = await fetch('/api/share-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: idea || '',
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
      const q = new URLSearchParams({ idea: idea || '', verdict: report.verdict, market_score: String(report.market_score || 0), feasibility_score: String(report.feasibility_score || 0) });
      if (report.summary?.one_liner) q.set('one_liner', report.summary.one_liner);
      window.open(`/api/share-card?${q.toString()}`, '_blank');
    } finally {
      setCardLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Top-left back button */}
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        返回
      </button>

      <div className="space-y-6">
        {/* Summary Card — shown first */}
        {report.summary && <SummaryCard report={report} idea={idea || ''} />}

      {/* Verdict banner */}
      <div className={`rounded-xl border-2 p-5 ${verdictStyle.bg} ${verdictStyle.text}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{verdictIcon}</span>
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xl font-bold">{verdictStyle.label}</p>
              <span className="text-lg text-amber-500 tracking-wider">
                {starRating((report.market_score + report.feasibility_score) / 2)}
              </span>
            </div>
            <p className="text-sm mt-1 opacity-80">{report.verdict_reason}</p>
            {report.sharp_comment && (
              <div className="flex items-start gap-2 mt-3 text-sm">
                <span className="text-amber-400 shrink-0">💬</span>
                <span className="italic opacity-80">{report.sharp_comment}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search evidence */}
      {report.competitors && report.competitors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2.5">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            AI 搜索发现 {report.competitors.length} 个相关产品
          </div>
          <div className="flex flex-wrap gap-2">
            {report.competitors.map((c, i) => (
              <div key={i} className="flex-1 min-w-[160px] bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.positioning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data source indicator */}
      <div className="flex items-center gap-4 text-xs text-gray-400 justify-center">
        {report.has_search_data && <span>🔍 含实时搜索数据</span>}
        <span>🤖 AI 分析</span>
        <span className="text-gray-300">|</span>
        <span>仅供参考</span>
      </div>

      {/* Quantitative scores */}
      {(report.market_score || report.feasibility_score) && (
        <Section title="量化评分">
          <div className="grid grid-cols-2 gap-4">
            <ScoreGauge label="市场前景" score={report.market_score} />
            <ScoreGauge label="开发可行性" score={report.feasibility_score} />
          </div>
          {report.scoring && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2 text-center">评分依据</p>
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
        </Section>
      )}

      {/* Market analysis */}
      <Section title="市场分析">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="竞品数量" value={report.market_analysis.competitor_count} />
          <StatCard label="市场需求" value={report.market_analysis.demand} />
          <StatCard label="竞争程度" value={report.market_analysis.competition_level} />
        </div>
      </Section>

      {/* SWOT */}
      {report.swot && (
        <Section title="SWOT 分析">
          <div className="grid grid-cols-2 gap-3">
            <SwotBox title="优势" items={report.swot.strengths} color="green" />
            <SwotBox title="劣势" items={report.swot.weaknesses} color="red" />
            <SwotBox title="机会" items={report.swot.opportunities} color="blue" />
            <SwotBox title="威胁" items={report.swot.threats} color="yellow" />
          </div>
        </Section>
      )}

      {/* Competitors */}
      {report.competitors.length > 0 && (
        <Section title="竞品列表" tag="search">
          <div className="space-y-3">
            {report.competitors.map((c, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  {c.source_url && (
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-blue-500 hover:text-blue-700 mt-0.5"
                    >
                      来源 ↗
                    </a>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{c.positioning}</p>
                {c.user_feedback && (
                  <p className="text-sm text-gray-400 mt-1 italic">{c.user_feedback}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Differentiation */}
      {report.differentiation && (
        <Section title="差异化空间">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.differentiation}
          </p>
        </Section>
      )}

      {/* Target users */}
      {report.target_users && (
        <Section title="建议目标用户">
          <p className="text-gray-700">{report.target_users}</p>
        </Section>
      )}

      {/* Pricing */}
      {report.pricing_suggestion && (
        <Section title="建议定价">
          <p className="text-gray-700">{report.pricing_suggestion}</p>
        </Section>
      )}

      {/* Acquisition channels */}
      {report.acquisition_channels && (
        <Section title="获客渠道建议">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
            {report.acquisition_channels}
          </div>
        </Section>
      )}

      {/* Cost budget */}
      {report.cost_budget && (
        <Section title="成本预算">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed">
            {report.cost_budget}
          </div>
        </Section>
      )}

      {/* Revenue estimation */}
      {report.revenue_estimation && (
        <Section title="收入预估">
          <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800 leading-relaxed">
            {report.revenue_estimation}
          </div>
        </Section>
      )}

      {/* Tech assessment */}
      {report.tech_assessment && (
        <Section title="技术实现评估">
          <div className="bg-indigo-50 rounded-lg p-4 text-sm text-indigo-800 leading-relaxed">
            {report.tech_assessment}
          </div>
        </Section>
      )}

      {/* MVP timeline */}
      {report.mvp_timeline && (
        <Section title="MVP 落地时间线">
          <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800 leading-relaxed">
            {report.mvp_timeline}
          </div>
        </Section>
      )}

      {/* Risk warnings */}
      {report.risk_warnings && report.risk_warnings.length > 0 && (
        <Section title="风险提示">
          <div className="space-y-2">
            {report.risk_warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-red-400 mt-0.5 shrink-0">⚠</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Data source disclaimer */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400 leading-relaxed">
          数据来源说明：竞品信息来自 Brave Search 实时搜索结果，市场分析、评分和风险提示由 AI 基于搜索数据及训练知识生成。
          <br />
          所有分析仅供参考，不构成投资或开发决策建议。
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              下载文件
              <svg className={`w-3.5 h-3.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showDownloadMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[160px]">
                <button onClick={() => { handleDownloadPdf(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  导出为 PDF
                </button>
                <button onClick={() => { handleDownloadMarkdown(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  导出为 Markdown
                </button>
              </div>
            )}
          </div>
          {onShare && (
            <button
              onClick={onShare}
              disabled={sharing}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {sharing ? '生成链接...' : '分享'}
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
          {onPmConsult && (
            <button
              onClick={onPmConsult}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                pmConsultOpen
                  ? 'bg-gray-100 text-gray-600 border border-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {pmConsultOpen ? '关闭 PM 顾问' : '追问深入分析'}
            </button>
          )}
          {(onGeneratePrd || onViewPrd) && (
            <button
              onClick={onViewPrd || onGeneratePrd}
              disabled={prdLoading || false}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {onViewPrd ? '查看 PRD' : prdLoading ? '生成中...' : '生成 PRD'}
              {!onViewPrd && !prdLoading && <span className="text-xs text-blue-200 font-normal">(⚡️消耗2积分)</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const SECTION_TAGS: Record<string, { label: string; style: string }> = {
  search: { label: '🔍 实时搜索', style: 'bg-blue-100 text-blue-600' },
  ai: { label: '🤖 AI 分析', style: 'bg-gray-100 text-gray-500' },
};

function Section({ title, children, tag }: { title: string; children: React.ReactNode; tag?: string }) {
  const t = tag ? SECTION_TAGS[tag] : null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        {title}
        {t && <span className={`text-[10px] font-normal uppercase px-1.5 py-0.5 rounded ${t.style}`}>{t.label}</span>}
      </h3>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function normalizedScore(...scores: number[]): number {
  const max = Math.max(...scores.filter(n => !isNaN(n)), 0);
  const avg = scores.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / scores.length;
  return max > 10 ? avg / 10 : avg;
}

function SummaryCard({ report, idea }: { report: ValidationReport; idea?: string }) {
  const s = report.summary;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      <div className="p-6">
        {idea && (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">🌱</span>
              <span className="text-[10px] text-gray-300 font-medium tracking-wider">芥子 · AI 产品验证</span>
            </div>
            <p className="text-sm font-medium text-gray-800 leading-relaxed mb-4">{idea}</p>
          </>
        )}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">结论摘要</span>
          </div>
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

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? 'bg-green-500' : score >= 4.5 ? 'bg-yellow-500' : 'bg-red-500';
  const bgColor = score >= 7 ? 'bg-green-100' : score >= 4.5 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-2xl font-bold text-gray-800">{score}</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
    </div>
  );
}

const SWOT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
};

function SwotBox({ title, items, color }: { title: string; items: string[]; color: string }) {
  const c = SWOT_COLORS[color] || SWOT_COLORS.green;
  return (
    <div className={`${c.bg} border ${c.border} rounded-lg p-3`}>
      <p className={`text-xs font-semibold ${c.text} mb-2 uppercase tracking-wider`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-gray-600 leading-relaxed">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
