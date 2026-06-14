import { NextRequest } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { dataDir } from '@/lib/data-dir';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^[0-9a-z]+$/i.test(id)) {
      return Response.json({ error: '分享链接不存在或已过期' }, { status: 404 });
    }
    const filePath = path.join(dataDir('shares'), `${id}.json`);

    if (!existsSync(filePath)) {
      return Response.json({ error: '分享链接不存在或已过期' }, { status: 404 });
    }

    const raw = await readFile(filePath, 'utf-8');
    const data = JSON.parse(raw);

    return Response.json({ success: true, data });
  } catch (error) {
    console.error('Share load error:', error);
    return Response.json({ error: '加载失败' }, { status: 500 });
  }
}
