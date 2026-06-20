'use client';

import { useState, useRef, useEffect } from 'react';
import type { PRD } from '@/lib/types';
import { getAuthHeaders } from '@/lib/client-id';

interface PRDViewProps {
  prd: PRD;
  onBack: () => void;
  onGeneratePreview?: () => void;
  previewLoading?: boolean;
  onShare?: () => void;
  sharing?: boolean;
  hasPreview?: boolean;
  onViewPreview?: () => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  P0: 'P0 核心',
  P1: 'P1 重要',
  P2: 'P2 增强',
};

const PRIORITY_STYLES: Record<string, string> = {
  P0: 'bg-red-50 text-red-600 border-red-200',
  P1: 'bg-blue-50 text-blue-600 border-blue-200',
  P2: 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function PRDView({ prd, onBack, onGeneratePreview, previewLoading, onShare, sharing, hasPreview, onViewPreview }: PRDViewProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/credits', { headers: { ...getAuthHeaders() } })
        .then(r => r.json())
        .then(d => setBalance(d.balance))
        .catch(() => {});
  }, []);

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

  const handleDownloadMarkdown = () => {
    const priorityLabel: Record<string, string> = { P0: '核心', P1: '重要', P2: '增强' };

    const md = `# ${prd.product_name}

${prd.one_liner}

## 产品定位
${prd.positioning}

${prd.target_users ? `## 目标用户
${prd.target_users}
` : ''}${prd.user_story ? `## 用户故事
${prd.user_story}
` : ''}${prd.features.length > 0 ? `## 功能列表

${prd.features.map(f => `### [${priorityLabel[f.priority] || f.priority}] ${f.name}
${f.description}
`).join('\n')}` : ''}${prd.user_flow ? `## 用户流程
${prd.user_flow}
` : ''}${prd.data_models.length > 0 ? `## 数据模型

${prd.data_models.map(d => `### ${d.entity}
${d.fields}
`).join('\n')}` : ''}${prd.tech_stack_suggestion ? `## 技术栈建议
${prd.tech_stack_suggestion}
` : ''}${prd.next_steps ? `## 下一步行动
${prd.next_steps}
` : ''}
---
*由芥子 AI 生成*`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prd.product_name}-PRD.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const featuresHtml = prd.features.map(f =>
      `<div style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;">
        <p style="margin:0 0 2px 0;font-weight:600;font-size:14px;"><span style="display:inline-block;padding:0 6px;border-radius:3px;font-size:11px;font-weight:600;margin-right:6px;background:${f.priority === 'P0' ? '#fee2e2' : f.priority === 'P1' ? '#dbeafe' : '#f3f4f6'};color:${f.priority === 'P0' ? '#dc2626' : f.priority === 'P1' ? '#2563eb' : '#6b7280'}">${f.priority}</span>${f.name}</p>
        <p style="margin:0;color:#666;font-size:13px;">${f.description}</p>
      </div>`
    ).join('');

    const dataModelsHtml = prd.data_models.map(d =>
      `<div style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:6px;margin-bottom:6px;">
        <p style="margin:0 0 2px 0;font-weight:600;font-size:14px;">${d.entity}</p>
        <p style="margin:0;color:#666;font-size:13px;">${d.fields}</p>
      </div>`
    ).join('');

    const printHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${prd.product_name} - PRD</title>
<style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Noto Sans SC,PingFang SC,Helvetica Neue,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;color:#333;line-height:1.6;}
h1{font-size:24px;color:#111;margin:0 0 4px 0;}h1 small{font-size:13px;color:#999;font-weight:400;}
.one-liner{font-size:15px;color:#666;margin:4px 0 24px 0;}
h2{color:#16a34a;margin:24px 0 8px 0;font-size:18px;}
.footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center;}
@media print{body{max-width:none;margin:20px;}h2{break-after:avoid;}div{break-inside:avoid;}}
</style></head><body>
<h1>${prd.product_name} <small>产品需求文档</small></h1>
<p class="one-liner">${prd.one_liner}</p>

<h2>产品定位</h2>
<p style="line-height:1.6;">${prd.positioning}</p>

${prd.target_users ? `<h2>目标用户</h2><p style="line-height:1.6;">${prd.target_users}</p>` : ''}
${prd.user_story ? `<h2>用户故事</h2><blockquote style="margin:8px 0;padding:10px 14px;border-left:4px solid #d1d5db;background:#f9fafb;color:#555;">${prd.user_story}</blockquote>` : ''}
${featuresHtml ? `<h2>功能列表</h2>${featuresHtml}` : ''}
${prd.user_flow ? `<h2>用户流程</h2><p style="line-height:1.6;white-space:pre-wrap;">${prd.user_flow}</p>` : ''}
${dataModelsHtml ? `<h2>数据模型</h2>${dataModelsHtml}` : ''}
${prd.tech_stack_suggestion ? `<h2>技术栈建议</h2><p style="line-height:1.6;">${prd.tech_stack_suggestion}</p>` : ''}
${prd.next_steps ? `<h2>下一步行动</h2><p style="line-height:1.6;">${prd.next_steps}</p>` : ''}

<div class="footer">由芥子 AI 生成</div>
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
      {/* Header */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-gray-900">{prd.product_name}</h2>
        <p className="text-gray-500 mt-2 leading-relaxed">{prd.one_liner}</p>
      </div>

      {/* Product positioning */}
      <Section title="产品定位">
        <p className="text-gray-700 leading-relaxed">{prd.positioning}</p>
      </Section>

      {/* Target users */}
      {prd.target_users && (
        <Section title="目标用户">
          <p className="text-gray-700">{prd.target_users}</p>
        </Section>
      )}

      {/* User story */}
      {prd.user_story && (
        <Section title="用户故事">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed border-l-4 border-gray-300">
            {prd.user_story}
          </div>
        </Section>
      )}

      {/* Features */}
      {prd.features.length > 0 && (
        <Section title="功能列表">
          <div className="space-y-2">
            {prd.features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                <span
                  className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded border ${PRIORITY_STYLES[f.priority] || PRIORITY_STYLES.P2}`}
                >
                  {PRIORITY_LABELS[f.priority] || f.priority}
                </span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{f.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* User flow */}
      {prd.user_flow && (
        <Section title="用户流程">
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {prd.user_flow}
          </div>
        </Section>
      )}

      {/* Data models */}
      {prd.data_models.length > 0 && (
        <Section title="数据模型">
          <div className="space-y-2">
            {prd.data_models.map((d, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-3">
                <p className="font-medium text-gray-900 text-sm">{d.entity}</p>
                <p className="text-sm text-gray-500 mt-0.5">{d.fields}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Tech stack */}
      {prd.tech_stack_suggestion && (
        <Section title="技术栈建议">
          <p className="text-gray-700 text-sm leading-relaxed">{prd.tech_stack_suggestion}</p>
        </Section>
      )}

      {/* Next steps */}
      {prd.next_steps && (
        <Section title="下一步行动">
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 leading-relaxed">
            {prd.next_steps}
          </div>
        </Section>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
        {/* Back — leftmost */}
        <button
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 active:scale-[0.98] transition-all flex items-center gap-1" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          返回验证报告
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Download */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 active:scale-[0.98] transition-all flex items-center gap-1" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}
            >
              下载文件
              <svg className={`w-3.5 h-3.5 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showDownloadMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[160px]">
                <button onClick={() => { handleDownloadPdf(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[rgba(255,255,255,0.3)] transition-colors">
                  导出为 PDF
                </button>
                <button onClick={() => { handleDownloadMarkdown(); setShowDownloadMenu(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[rgba(255,255,255,0.3)] transition-colors border-t border-gray-100">
                  导出为 Markdown
                </button>
              </div>
            )}
          </div>

          {/* Share */}
          {onShare && (
            <button
              onClick={onShare}
              disabled={sharing}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
              {sharing ? '生成链接...' : '分享'}
            </button>
          )}

          {/* Preview */}
          {hasPreview && onViewPreview ? (
            <button
              onClick={onViewPreview}
              className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white active:scale-[0.98] transition-all flex items-center gap-1.5" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              查看产品预览
            </button>
          ) : onGeneratePreview && (
            <div className="relative group">
              <button
                onClick={balance !== null && balance < 3 ? () => window.location.href = '/pricing' : onGeneratePreview}
                disabled={previewLoading}
                className="rounded-xl gradient-primary px-4 py-2.5 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center gap-1.5" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                {previewLoading ? '生成中...' : balance !== null && balance < 3 ? '积分不足，去充值' : <>生成产品预览页<span className="text-amber-300">（⚡️消耗3积分）</span></>}
              </button>
              {/* Tooltip when credits insufficient */}
              {balance !== null && balance < 3 && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  当前余额 {balance} 分，需要 3 分
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
