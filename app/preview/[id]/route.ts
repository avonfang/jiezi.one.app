import { NextRequest } from 'next/server';
import { kvGet } from '@/lib/kv-store';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await kvGet<{ html: string; product_name?: string; created_at?: number }>(`preview:${id}`);

    if (!data) {
      return new Response('预览页面不存在', { status: 404 });
    }

    // Inject OG meta tags and Tailwind CSS for shared preview
    const productName = data.product_name || '产品预览';
    const escapeHtml = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const headInjection = `<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="/tailwind/prebuilt.css" />
<meta property="og:title" content="${escapeHtml(productName)}" />
<meta property="og:description" content="用芥子 AI 生成的产品预览页" />
<meta property="og:image" content="https://jiezi.site/share-card-test.png" />
<meta property="og:type" content="website" />`;
    let html = data.html;
    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, headInjection + '</head>');
    } else if (/<html[^>]*>/i.test(html)) {
      html = html.replace(/(<html[^>]*>)/i, '$1<head>' + headInjection + '</head>');
    } else {
      html = '<!DOCTYPE html><html><head>' + headInjection + '</head><body>' + html + '</body></html>';
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Preview serve error:', error);
    return new Response('加载失败', { status: 500 });
  }
}
