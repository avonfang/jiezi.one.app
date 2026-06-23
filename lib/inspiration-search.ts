interface RawSource {
  title: string;
  snippet: string;
  url: string;
  source: 'hn' | 'github' | 'brave';
}

/** Fetch top Hacker News stories via Firebase API */
export async function searchHN(): Promise<RawSource[]> {
  try {
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    if (!topRes.ok) return [];
    const ids: number[] = await topRes.json();
    const batch = ids.slice(0, 10);

    const items = await Promise.allSettled(
      batch.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );

    return items
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value?.title)
      .map(r => ({
        title: r.value.title,
        snippet: r.value.text || r.value.url || '',
        url: r.value.url || `https://news.ycombinator.com/item?id=${r.value.id}`,
        source: 'hn' as const,
      }));
  } catch {
    return [];
  }
}

/** Search GitHub trending / popular repos */
export async function searchGitHub(query: string): Promise<RawSource[]> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      title: item.full_name,
      snippet: item.description || '',
      url: item.html_url,
      source: 'github' as const,
    }));
  } catch {
    return [];
  }
}
