import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/admin-auth';
import { getTutorials, saveTutorials } from '@/lib/tutorials';
import { TUTORIAL_CATEGORIES, type Tutorial } from '@/lib/tutorial-types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) return Response.json({ error: '未授权' }, { status: 401 });
  try {
    return Response.json({ tutorials: await getTutorials() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '教程读取失败' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!checkAdminAuth(request)) return Response.json({ error: '未授权' }, { status: 401 });
  try {
    if (Number(request.headers.get('content-length') || 0) > 50000) {
      return Response.json({ error: '内容过长' }, { status: 413 });
    }
    const body = await request.json();
    const value = body?.tutorial;
    if (!value || typeof value !== 'object') return Response.json({ error: '教程内容无效' }, { status: 400 });
    const title = typeof value.title === 'string' ? value.title.trim() : '';
    const desc = typeof value.desc === 'string' ? value.desc.trim() : '';
    const cat = value.cat;
    const emoji = typeof value.emoji === 'string' ? value.emoji.trim() : '';
    const mins = typeof value.mins === 'string' ? value.mins.trim() : '';
    const prompt = typeof value.prompt === 'string' ? value.prompt.trim() : '';
    const content = typeof value.content === 'string' ? value.content.trim() : '';
    const paras = Array.isArray(value.paras) && value.paras.every((p: unknown) => typeof p === 'string')
      ? (value.paras as string[]).map(p => p.trim()).filter(Boolean) : [];
    const task = Array.isArray(value.task) && value.task.every((t: unknown) => typeof t === 'string')
      ? (value.task as string[]).map(t => t.trim()).filter(Boolean) : [];
    if (!title || title.length > 120 || !desc || desc.length > 300 ||
        !TUTORIAL_CATEGORIES.includes(cat) || !emoji || emoji.length > 12 ||
        !mins || mins.length > 20 || (!content && paras.length === 0) || content.length > 30000 || paras.length > 30 ||
        paras.some(p => p.length > 3000) || task.length > 20 || task.some(t => t.length > 500) ||
        prompt.length > 5000 || typeof value.published !== 'boolean') {
      return Response.json({ error: '请检查必填内容与长度限制' }, { status: 400 });
    }
    const tutorials = await getTutorials();
    const id = typeof value.id === 'string' ? value.id : '';
    const index = id ? tutorials.findIndex(t => t.id === id) : -1;
    if (id && index === -1) return Response.json({ error: '教程不存在，请刷新后重试' }, { status: 404 });
    const tutorial: Tutorial = {
      id: id || crypto.randomUUID(), title, desc, cat, emoji, mins, paras, task,
      ...(content ? { content } : {}),
      ...(prompt ? { prompt } : {}), published: value.published,
    };
    if (index >= 0) tutorials[index] = tutorial;
    else tutorials.unshift(tutorial);
    await saveTutorials(tutorials);
    return Response.json({ tutorial });
  } catch {
    return Response.json({ error: '保存失败，请稍后重试' }, { status: 500 });
  }
}
