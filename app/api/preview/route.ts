import { NextRequest } from 'next/server';
import { generateShortId } from '@/lib/id-gen';
import { kvSet } from '@/lib/kv-store';

export async function POST(request: NextRequest) {
  try {
    const { html, product_name } = await request.json();

    if (!html || html.length < 100) {
      return Response.json({ error: '无效的预览数据' }, { status: 400 });
    }

    if (html.length > 500000) {
      return Response.json({ error: '预览内容过大' }, { status: 400 });
    }

    // Remove any Tailwind CDN / Play scripts from AI HTML
    const cleanedHtml = html
      .replace(/<script[^>]*src=["'][^"']*cdn\.tailwindcss\.com[^"']*["'][^>]*>\s*<\/script>\s*/gi, '')
      .replace(/https?:\/\/cdn\.tailwindcss\.com[^\s"']*/g, '')
      .replace(/<script[^>]*src=["'][^"']*\/tailwind\/play\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi, '');

    // Inject self-hosted pre-built Tailwind CSS
    const linkHtml = '<link rel="stylesheet" href="/tailwind/prebuilt.css">';
    let processedHtml: string;
    if (/<\/head>/i.test(cleanedHtml)) {
      processedHtml = cleanedHtml.replace(/<\/head>/i, `${linkHtml}</head>`);
    } else if (/<html[^>]*>/i.test(cleanedHtml)) {
      processedHtml = cleanedHtml.replace(/(<html[^>]*>)/i, `$1<head>${linkHtml}</head>`);
    } else {
      processedHtml = `${linkHtml}${cleanedHtml}`;
    }

    const id = generateShortId(12);
    await kvSet(`preview:${id}`, {
      html: processedHtml,
      product_name,
      created_at: Date.now(),
    });

    return Response.json({ success: true, id, url: `/preview/${id}` });
  } catch (error) {
    console.error('Preview save error:', error);
    return Response.json({ error: '保存失败' }, { status: 500 });
  }
}
