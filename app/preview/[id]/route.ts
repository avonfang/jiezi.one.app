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

    return new Response(data.html, {
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
