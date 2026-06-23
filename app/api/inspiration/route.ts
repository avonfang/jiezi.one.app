import { NextRequest, NextResponse } from 'next/server';
import { search } from '@/lib/brave-search';
import { searchHN, searchGitHub } from '@/lib/inspiration-search';
import { chatCompletion } from '@/lib/deepseek';
import { kvGet, kvSet } from '@/lib/kv-store';
import { checkRateLimit } from '@/lib/rate-limit';
import { getUserIdFromRequest } from '@/lib/get-user';
import { INSPIRATION_CATEGORIES, type InspirationCategory, type InspirationResponse } from '@/lib/types';

// ── Cache helpers (manual TTL since kvSet doesn't set EX) ─────────────

const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getCached(key: string): Promise<InspirationResponse | null> {
  const raw = await kvGet<{ data: InspirationResponse; ts: number }>(key);
  if (!raw) return null;
  if (Date.now() - raw.ts > CACHE_TTL) return null;
  return raw.data;
}

async function setCached(key: string, data: InspirationResponse): Promise<void> {
  await kvSet(key, { data, ts: Date.now() });
}

// ── DeepSeek aggregation prompt ───────────────────────────────────────

function buildPrompt(category: string, braveResults: string[], hnResults: string[], githubResults: string[]): string {
  const allSections = [
    braveResults.length ? `## Web Search Results\n${braveResults.join('\n')}` : '',
    hnResults.length ? `## Hacker News\n${hnResults.join('\n')}` : '',
    githubResults.length ? `## GitHub Trending\n${githubResults.join('\n')}` : '',
  ].filter(Boolean).join('\n\n');

  return `你是一个产品灵感分析师。以下是一组来自不同来源的最新趋势信息（分类：${category}）。

请分析这些信息，找出其中最有产品价值的趋势和机会，返回 JSON（不要 markdown 包裹）。

要求：
1. summary — 一段总体趋势概述（中文，2-3句话）
2. items — 数组，每项包含：
   - title: 标题（中文）
   - summary: 一句话摘要（中文）
   - why_hot: 为什么火 / 趋势原因（中文，1-2句话）
   - product_opportunity: 产品机会分析（中文，1-2句话）
   - tags: 标签数组（如 ["AI","SaaS"]，英文）
   - source_url: 原始来源 URL
   - source_label: 来源名称（如 "Hacker News"、"GitHub"）
3. sources — 所有来源的 { label, url } 数组

最多输出 8 个 items。质量优先。

${allSections}`;
}

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category') as InspirationCategory | null;
  if (!category || !INSPIRATION_CATEGORIES.some(c => c.id === category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }

  const userId = getUserIdFromRequest(request) || 'anonymous';

  // Rate limit: 1 request per 30 seconds per user
  const rl = await checkRateLimit(`inspiration:${userId}`, 1, 30000);
  if (!rl.allowed) {
    return NextResponse.json({ error: '请勿频繁刷新，30 秒后再试' }, { status: 429 });
  }

  const cacheKey = `inspiration:${category}`;

  // Check cache
  const cached = await getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true }, {
      headers: { 'X-Data-Stale': '0' },
    });
  }

  const catConfig = INSPIRATION_CATEGORIES.find(c => c.id === category)!;

  // ── Concurrent search ─────────────────────────────────────────────
  const [braveResults, hnResults, githubResults] = await Promise.all([
    // Brave Search: run 3-4 queries concurrently, deduplicate by URL
    Promise.allSettled(catConfig.queries.map(q => search(q, 3).catch(() => []))).then(results =>
      results
        .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
        .filter((item, i, arr) => arr.findIndex(x => x.url === item.url) === i)
    ),
    searchHN(),
    searchGitHub(catConfig.queries[0]),
  ]);

  const formatItem = (item: { title?: string; name?: string; snippet: string; url: string }) =>
    `- ${item.title || item.name || ''}\n  ${item.snippet}\n  ${item.url}`;

  // ── DeepSeek aggregation (with 15s timeout) ───────────────────────
  const prompt = buildPrompt(
    catConfig.label,
    braveResults.map(formatItem),
    hnResults.map(formatItem),
    githubResults.map(formatItem),
  );

  const deepseekPromise = chatCompletion([
    { role: 'system', content: '只返回 JSON。不要 markdown。不要解释。' },
    { role: 'user', content: prompt },
  ], { temperature: 0.7, max_tokens: 2048 });

  const timeoutPromise = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error('DeepSeek timeout')), 15000)
  );

  let response: InspirationResponse;
  try {
    const raw = await Promise.race([deepseekPromise, timeoutPromise]);
    if (!raw) throw new Error('empty response');

    const parsed = JSON.parse(raw.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim());
    response = {
      summary: parsed.summary || '暂无趋势摘要',
      items: (parsed.items || []).slice(0, 8),
      sources: parsed.sources || [],
    };
  } catch {
    // Fallback: return raw search results as simple items
    const fallbackItems = [
      ...braveResults.map(r => ({
        title: r.name,
        summary: r.snippet,
        why_hot: '来自 Web 搜索的热门内容',
        product_opportunity: '建议点击来源链接了解更多',
        tags: [category],
        source_url: r.url,
        source_label: 'Web',
      })),
      ...hnResults.map(r => ({
        title: r.title,
        summary: r.snippet || 'Hacker News 热门',
        why_hot: 'Hacker News 热门讨论',
        product_opportunity: '建议点击来源链接了解更多',
        tags: [category, 'HN'],
        source_url: r.url,
        source_label: 'Hacker News',
      })),
      ...githubResults.map(r => ({
        title: r.title,
        summary: r.snippet || 'GitHub 热门项目',
        why_hot: 'GitHub 趋势仓库',
        product_opportunity: '建议点击来源链接了解更多',
        tags: [category, 'GitHub'],
        source_url: r.url,
        source_label: 'GitHub',
      })),
    ].slice(0, 8);

    response = {
      summary: `以下是与「${catConfig.label}」相关的最新趋势。`,
      items: fallbackItems,
      sources: [],
    };
  }

  // Cache and return
  await setCached(cacheKey, response);

  return NextResponse.json(response, {
    headers: {
      'X-Data-Stale': '0',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
