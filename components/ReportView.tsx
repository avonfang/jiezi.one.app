'use client';

import { useState, useRef, useEffect } from 'react';
import type { ValidationReport } from '@/lib/types';

interface ReportViewProps {
  report: ValidationReport;
  onReset: () => void;
  onGeneratePrd?: () => void;
  prdLoading?: boolean;
  onPmConsult?: () => void;
  pmConsultOpen?: boolean;
  onShare?: () => void;
  sharing?: boolean;
}

const VERDICT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  '推荐做': { bg: 'bg-green-50 border-green-200', text: 'text-green-700', label: '推荐做' },
  '谨慎做': { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', label: '谨慎做' },
  '不建议做': { bg: 'bg-red-50 border-red-200', text: 'text-red-700', label: '不建议做' },
};

const VERDICT_ICONS: Record<string, string> = {
  '推荐做': '🟢',
  '谨慎做': '🟡',
  '不建议做': '🔴',
};

export default function ReportView({ report, onReset, onGeneratePrd, prdLoading, onPmConsult, pmConsultOpen, onShare, sharing }: ReportViewProps) {
  const verdictStyle = VERDICT_STYLES[report.verdict] || VERDICT_STYLES['谨慎做'];
  const verdictIcon = VERDICT_ICONS[report.verdict] || '🟡';

  const handleDownloadMarkdown = () => {
    const md = `# 产品验证报告

## 综合判断
${report.verdict} — ${report.verdict_reason}

## 量化评分
- 市场前景：${report.market_score}/100
- 开发可行性：${report.feasibility_score}/100

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
<p style="font-size:16px;font-weight:600;color:${report.verdict === '推荐做' ? '#16a34a' : report.verdict === '谨慎做' ? '#ca8a04' : '#dc2626'}">${report.verdict}</p>
<p style="color:#555;line-height:1.6;margin:4px 0 20px 0;">${report.verdict_reason}</p>

<h2 style="color:#16a34a;margin:20px 0 8px 0;font-size:18px;">量化评分</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
<tr><td style="padding:8px 12px;background:#f0fdf4;border:1px solid #dcfce7;font-weight:500;">市场前景</td><td style="padding:8px 12px;background:#f0fdf4;border:1px solid #dcfce7;">${report.market_score}/100</td></tr>
<tr><td style="padding:8px 12px;background:#fefce8;border:1px solid #fef9c3;font-weight:500;">开发可行性</td><td style="padding:8px 12px;background:#fefce8;border:1px solid #fef9c3;">${report.feasibility_score}/100</td></tr>
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
<div class="verdict" style="background:${report.verdict === '推荐做' ? '#dcfce7' : report.verdict === '谨慎做' ? '#fef9c3' : '#fee2e2'};color:${report.verdict === '推荐做' ? '#16a34a' : report.verdict === '谨慎做' ? '#a16207' : '#dc2626'}">${report.verdict}</div>
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Verdict banner */}
      <div className={`rounded-xl border-2 p-5 ${verdictStyle.bg} ${verdictStyle.text}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{verdictIcon}</span>
          <div>
            <p className="text-xl font-bold">{report.verdict}</p>
            <p className="text-sm mt-1 opacity-80">{report.verdict_reason}</p>
          </div>
        </div>
      </div>

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
      <div className="flex items-center justify-center gap-3 pt-4 flex-wrap">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowDownloadMenu(v => !v)}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
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
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {sharing ? '生成链接...' : '分享'}
          </button>
        )}
        {onPmConsult && (
          <button
            onClick={onPmConsult}
            className={`rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
              pmConsultOpen
                ? 'bg-gray-100 text-gray-600 border border-gray-300'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {pmConsultOpen ? '关闭 PM 顾问' : '追问深入分析'}
          </button>
        )}
        {onGeneratePrd && (
          <button
            onClick={onGeneratePrd}
            disabled={prdLoading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {prdLoading ? '生成中...' : '生成 PRD'}
          </button>
        )}
        <button
          onClick={onReset}
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          验证另一个想法
        </button>
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

function ScoreGauge({ label, score }: { label: string; score: number }) {
  const color = score >= 70 ? 'bg-green-500' : score >= 45 ? 'bg-yellow-500' : 'bg-red-500';
  const bgColor = score >= 70 ? 'bg-green-100' : score >= 45 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-2xl font-bold text-gray-800">{score}</span>
      </div>
      <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${score}%` }}
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
