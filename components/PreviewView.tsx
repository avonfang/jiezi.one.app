'use client';

import { useRef } from 'react';
import type { PreviewPage } from '@/lib/types';

interface PreviewViewProps {
  preview: PreviewPage;
  onBack: () => void;
}

export default function PreviewView({ preview, onBack }: PreviewViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleDownload = () => {
    const blob = new Blob([preview.html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preview.product_name || 'product'}-landing.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{preview.product_name}</h2>
          <p className="text-sm text-gray-500">静态预览 + 动画演示</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            下载 HTML
          </button>
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            返回
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <span className="ml-2 text-xs text-gray-400">
            {preview.product_name} — 产品演示
          </span>
        </div>
        <iframe
          ref={iframeRef}
          srcDoc={preview.html}
          className="w-full border-0"
          title="product-preview"
          style={{ height: '600px' }}
          sandbox="allow-scripts"
        />
      </div>

      <p className="text-xs text-gray-400 text-center mt-3">
        上半部分为产品静态设计预览，点击"观看演示"滚动到动画演示区。下载 HTML 可保存为独立文件，双击浏览器打开即可使用。
      </p>
    </div>
  );
}
