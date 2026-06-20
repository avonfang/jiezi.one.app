import { kvGet, kvSet } from '@/lib/kv-store';

const FEEDBACK_KEY = 'feedback:all';

export async function POST(request: Request) {
  try {
    const { content, contact, type } = await request.json();
    if (!content || typeof content !== 'string' || content.trim().length < 2) {
      return Response.json({ error: '内容太短' }, { status: 400 });
    }
    if (content.length > 5000) {
      return Response.json({ error: '内容过长，请精简到 5000 字以内' }, { status: 400 });
    }

    const id = Date.now().toString(36);
    const item = {
      id,
      type: type?.trim() || '',
      content: content.trim(),
      contact: contact?.trim() || '',
      created_at: Date.now(),
    };

    const existing = await kvGet<any[]>(FEEDBACK_KEY) || [];
    existing.unshift(item);
    await kvSet(FEEDBACK_KEY, existing);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: '提交失败' }, { status: 500 });
  }
}
