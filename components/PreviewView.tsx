'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toPng } from 'html-to-image';
import DOMPurify from 'dompurify';
import type { PreviewPage } from '@/lib/types';

interface PreviewViewProps {
  preview: PreviewPage;
  onBack: () => void;
  onRegenerate?: () => void;
  regenerateLoading?: boolean;
  onShare?: () => void;
  sharing?: boolean;
}

export default function PreviewView({ preview, onBack, onRegenerate, regenerateLoading, onShare, sharing }: PreviewViewProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(600);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'preview-resize' && event.data.height) {
        setHeight(event.data.height);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    if (showShareMenu) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showShareMenu]);

  // Sanitize AI-generated HTML to prevent XSS
  const sanitizedHtml = useMemo(() => DOMPurify.sanitize(preview.html), [preview.html]);

  // Inject prebuilt Tailwind CSS into the preview HTML
  const cssLink = '<link rel="stylesheet" href="/tailwind/prebuilt.css">';
  const injectCss = (html: string) => {
    if (/<\/head>/i.test(html)) return html.replace('</head>', `${cssLink}</head>`);
    if (/<html[^>]*>/i.test(html)) return html.replace(/(<html[^>]*>)/i, `$1<head>${cssLink}</head>`);
    return `${cssLink}${html}`;
  };
  const enrichedHtml = injectCss(sanitizedHtml);
  // Add auto-height script
  const srcDoc = enrichedHtml.replace(
    '</body>',
    `<script>window.addEventListener('load',function(){
      var h=document.documentElement.scrollHeight;
      parent.postMessage({type:'preview-resize',height:Math.min(h,10000)},'*');
    });<\/script></body>`
  );

  const handleCopyLink = () => {
    if (onShare) onShare();
    setShowShareMenu(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveImage = async () => {
    if (!containerRef.current) return;
    setSavingImage(true);
    try {
      const dataUrl = await toPng(containerRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${preview.product_name}-预览截图.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // fallback: open in new window for manual save
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(enrichedHtml);
        win.document.close();
      }
    } finally {
      setSavingImage(false);
      setShowShareMenu(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{preview.product_name}</h2>
          <p className="text-sm text-gray-500">产品预览</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Share button */}
          {onShare && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowShareMenu(v => !v)}
                disabled={sharing}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
                </svg>
                {sharing ? '生成链接...' : '分享'}
              </button>
              {showShareMenu && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 min-w-[170px]">
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    复制分享链接
                  </button>
                  <button
                    onClick={handleSaveImage}
                    disabled={savingImage}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors border-t border-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {savingImage ? '保存中...' : '保存为图片'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Back */}
          <button
            onClick={onBack}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            返回
          </button>
        </div>
      </div>

      {/* Regenerate row */}
      {onRegenerate && (
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => {
              const win = window.open('', '_blank');
              if (win) {
                win.document.write(enrichedHtml);
                win.document.close();
              }
            }}
            className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
          >
            全屏预览
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/app/xumi')}
              className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
            >
              须弥 · 更多功能
            </button>
            {regenerateLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              重新生成中...
            </div>
          ) : (
            <button
              onClick={onRegenerate}
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              不满意？重新生成
              <span className="text-[10px] text-amber-500 font-medium flex items-center gap-0.5 ml-0.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                消耗 3 积分
              </span>
            </button>
          )}
          </div>
        </div>
      )}

      {/* Preview iframe — view only, no clicks */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" ref={containerRef}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          className="w-full border-0 pointer-events-none"
          title="product-preview"
          style={{ height: `${height}px` }}
          sandbox="allow-scripts"
        />
      </div>

      {/* Toast: link copied */}
      {copied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-5 py-3 rounded-xl shadow-lg z-50">
          链接已复制，可以分享给朋友了
        </div>
      )}
    </div>
  );
}
