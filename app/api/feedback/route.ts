import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { dataDir } from '@/lib/data-dir';

const FEEDBACK_DIR = dataDir('feedback');

export async function POST(request: Request) {
  try {
    const { content, contact } = await request.json();
    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return Response.json({ error: '内容太短' }, { status: 400 });
    }

    await mkdir(FEEDBACK_DIR, { recursive: true });
    const id = Date.now().toString(36);
    const data = {
      id,
      content: content.trim(),
      contact: contact?.trim() || '',
      created_at: Date.now(),
    };
    await writeFile(path.join(FEEDBACK_DIR, `${id}.json`), JSON.stringify(data), 'utf-8');

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: '提交失败' }, { status: 500 });
  }
}
