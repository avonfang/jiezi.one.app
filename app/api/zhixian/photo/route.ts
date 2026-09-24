import { NextRequest } from 'next/server';
import { ProxyAgent } from 'undici';

// 公众人物照片查找：优先取维基百科(中文)词条头像，代理返回图片字节，避免国内直连不稳定。
const cache = new Map<string, string | null>();

const UA = 'jiezi.one/1.0 (zhixian celebrity card)';

let _proxy: ProxyAgent | null = null;
function dispatcher() {
  const proxy = process.env.BAIDU_HTTP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return {};
  if (!_proxy) _proxy = new ProxyAgent({ uri: proxy });
  return { dispatcher: _proxy };
}

async function wikiThumb(lang: string, title: string): Promise<string | null> {
  try {
    const u = 'https://' + lang + '.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=600&redirects=1&titles=' + encodeURIComponent(title);
    const res = await fetch(u, { headers: { 'User-Agent': UA }, ...dispatcher() });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.includes('too many requests')) return null;
    const data = JSON.parse(text) as { query?: { pages?: Record<string, { thumbnail?: { source?: string } } | undefined> } };
    const pages = data?.query?.pages || {};
    for (const k of Object.keys(pages)) {
      const t = pages[k]?.thumbnail?.source;
      if (t) return t;
    }
    return null;
  } catch {
    return null;
  }
}

async function resolvePhoto(name: string): Promise<string | null> {
  const key = name.trim();
  if (cache.has(key)) return cache.get(key) ?? null;
  let url = await wikiThumb('zh', key);
  if (!url) url = await wikiThumb('en', key);
  cache.set(key, url);
  return url;
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name') || '';
  if (!name.trim()) return Response.json({ error: 'missing name' }, { status: 400 });
  try {
    const url = await resolvePhoto(name);
    if (!url) return new Response(null, { status: 404 });
    const img = await fetch(url, { headers: { 'User-Agent': UA }, ...dispatcher() });
    if (!img.ok) return new Response(null, { status: 404 });
    const buf = await img.arrayBuffer();
    const ct = img.headers.get('content-type') || 'image/jpeg';
    return new Response(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('zhixian photo error:', e);
    return new Response(null, { status: 500 });
  }
}
