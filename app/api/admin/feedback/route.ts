import { NextRequest } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import path from 'path';
import { dataDir } from '@/lib/data-dir';
import { checkAdminAuth } from '@/lib/admin-auth';

const FEEDBACK_DIR = dataDir('feedback');

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }

  try {
    const files = await readdir(FEEDBACK_DIR).catch(() => []);
    const feedbacks = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
        .map(async (f) => {
          try {
            const content = await readFile(path.join(FEEDBACK_DIR, f), 'utf-8');
            return JSON.parse(content);
          } catch {
            return null;
          }
        }),
    );
    return Response.json({ feedbacks: feedbacks.filter(Boolean) });
  } catch {
    return Response.json({ feedbacks: [] });
  }
}
