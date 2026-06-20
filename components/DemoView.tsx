'use client';

import { useRef } from 'react';

interface DemoViewProps {
  html: string;
  onBack: () => void;
}

export default function DemoView({ html, onBack }: DemoViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '芥子-产品演示.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">产品演示</h2>
            <p className="text-sm text-gray-500">芥子使用流程动画展示</p>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="rounded-xl gradient-primary px-5 py-2 text-sm font-medium text-white active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
        >
          下载演示
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-gray-400">芥子 — 产品演示</span>
        </div>
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full border-0"
          title="product-demo"
          style={{ height: '600px' }}
          sandbox="allow-scripts"
        />
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        自动播放的产品演示页，展示芥子的完整使用流程。
      </p>
    </div>
  );
}
