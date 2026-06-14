import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { dataDir } from '@/lib/data-dir';
import type { ShareData } from '@/lib/types';
import { generateShortId } from '@/lib/id-gen';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, report, prd, preview } = body;

    if (!idea || !report) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // Limit payload size
    const raw = JSON.stringify(body);
    if (raw.length > 1048576) {
      return Response.json({ error: '内容过大，无法分享' }, { status: 400 });
    }

    const id = generateShortId(12);
    const dir = dataDir('shares');
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    const data: ShareData = { idea, report, prd, preview, created_at: Date.now() };
    await writeFile(path.join(dir, `${id}.json`), JSON.stringify(data), 'utf-8');

    return Response.json({ success: true, id });
  } catch (error) {
    console.error('Share save error:', error);
    return Response.json({ error: '保存失败' }, { status: 500 });
  }
}
