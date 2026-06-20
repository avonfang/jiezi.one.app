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

    // Inject viewport + prebuilt CSS
    const headInjection = '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<link rel="stylesheet" href="/tailwind/prebuilt.css">';
    let processedHtml: string;
    if (/<\/head>/i.test(html)) {
      processedHtml = html.replace(/<\/head>/i, `${headInjection}</head>`);
    } else if (/<html[^>]*>/i.test(html)) {
      processedHtml = html.replace(/(<html[^>]*>)/i, `$1<head>${headInjection}</head>`);
    } else {
      processedHtml = `<!DOCTYPE html><html><head>${headInjection}</head><body>${html}</body></html>`;
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
