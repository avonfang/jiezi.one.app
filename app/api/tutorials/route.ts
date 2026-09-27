import { getTutorials } from '@/lib/tutorials';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tutorials = (await getTutorials()).filter(t => t.published);
    return Response.json({ tutorials }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: '教程暂时无法加载' }, { status: 503 });
  }
}
