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
  const [iframeLoaded, setIframeLoaded] = useState(false);
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

  // Sanitize AI-generated HTML: strip scripts/event handlers, preserve <style> and document structure
  const sanitizedHtml = useMemo(() => {
    const html = preview.html;
    // Extract and clean head content (remove scripts but keep styles)
    const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
    const headContent = headMatch ? headMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '') : '';
    // Extract body content
    const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    // Sanitize body: strip scripts, event handlers, but keep safe tags and CSS
    const sanitizedBody = DOMPurify.sanitize(bodyContent, {
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
      ALLOW_UNKNOWN_PROTOCOLS: true,
    });
    return `<!DOCTYPE html><html><head>${headContent}</head><body>${sanitizedBody}</body></html>`;
  }, [preview.html]);

  // Inject viewport and prebuilt CSS into the generated HTML
  const headTags = '<meta name="viewport" content="width=device-width, initial-scale=1.0"><link rel="stylesheet" href="/tailwind/prebuilt.css">';
  const injectHead = (html: string, content: string) => {
    if (/<\/head>/i.test(html)) return html.replace(/<\/head>/i, `${content}</head>`);
    if (/<html[^>]*>/i.test(html)) return html.replace(/(<html[^>]*>)/i, `$1<head>${content}</head>`);
    return `${content}${html}`;
  };
  const enrichedHtml = injectHead(sanitizedHtml, headTags);
  const srcDoc = enrichedHtml.replace(
    '</body>',
    `<script>(function(){
      var send=function(){var h=document.documentElement.scrollHeight;parent.postMessage({type:'preview-resize',height:Math.min(h,10000)},'*');};
      window.addEventListener('load',function(){setTimeout(send,500)});
      if(window.ResizeObserver){var ro=new ResizeObserver(function(){send()});ro.observe(document.body);}
      setTimeout(send,1500);
    })();<\/script></body>`
  );

  const handleCopyLink = () => {
    if (onShare) onShare();
    setShowShareMenu(false);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSaveImage = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setSavingImage(true);

    try {
      // Access iframe document
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error('无法访问预览内容');

      // Wait for content to be fully rendered
      const body = doc.body;
      const htmlEl = doc.documentElement;
      const fullWidth = Math.max(body.scrollWidth, htmlEl?.scrollWidth || 0, 1024);
      const fullHeight = Math.max(body.scrollHeight, htmlEl?.scrollHeight || 0);

      // Temporarily set body to natural size for clean capture
      const origOverflow = htmlEl?.style.overflow;
      const origBodyOverflow = body.style.overflow;
      if (htmlEl) htmlEl.style.overflow = 'visible';
      body.style.overflow = 'visible';

      // Force reflow
      doc.defaultView?.scrollTo(0, 0);

      // Wait for fonts/images/tailwind to settle
      await new Promise(r => setTimeout(r, 800));

      // Capture directly from the iframe document body
      const dataUrl = await toPng(body, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: fullWidth,
        height: fullHeight,
        canvasWidth: fullWidth * 2,
        canvasHeight: fullHeight * 2,
      });

      // Restore styles
      if (htmlEl && origOverflow !== undefined) htmlEl.style.overflow = origOverflow;
      body.style.overflow = origBodyOverflow;

      const link = document.createElement('a');
      link.download = `${preview.product_name}-预览截图.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      // Fallback: open in new window for manual save
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
            <h2 className="text-xl font-bold text-gray-900">{preview.product_name}</h2>
            <p className="text-sm text-gray-500">产品预览</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share button */}
          {onShare && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowShareMenu(v => !v)}
                disabled={sharing}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 disabled:opacity-50 active:scale-[0.98] transition-all flex items-center gap-1" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}
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
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[rgba(255,255,255,0.3)] transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    复制分享链接
                  </button>
                  <button
                    onClick={handleSaveImage}
                    disabled={savingImage}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[rgba(255,255,255,0.3)] disabled:opacity-50 transition-colors border-t border-gray-100 flex items-center gap-2"
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
            className="rounded-xl px-4 py-2 text-sm font-medium text-purple-700 active:scale-[0.98] transition-all flex items-center gap-1.5" style={{background:'rgba(124,108,240,0.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(124,108,240,0.15)'}}
          >
            全屏预览
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/app/xumi')}
              className="rounded-xl px-4 py-2 text-sm font-medium text-purple-700 active:scale-[0.98] transition-all flex items-center gap-1.5" style={{background:'rgba(124,108,240,0.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(124,108,240,0.15)'}}
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
              className="rounded-xl px-4 py-2 text-sm font-medium text-amber-700 active:scale-[0.98] transition-all flex items-center gap-1.5" style={{background:'rgba(255,159,10,0.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,159,10,0.15)'}}
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

      {/* Preview iframe */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white" ref={containerRef}>
        <iframe
          ref={iframeRef}
          srcDoc={srcDoc}
          onLoad={() => setIframeLoaded(true)}
          className="w-full border-0"
          title="product-preview"
          style={{ height: `${height}px` }}
          sandbox="allow-scripts allow-same-origin"
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
