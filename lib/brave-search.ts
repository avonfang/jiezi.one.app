const API_KEY = process.env.BRAVE_SEARCH_API_KEY || '';

interface SearchResult {
  name: string;
  snippet: string;
  url: string;
}

export async function search(query: string, count: number = 5): Promise<SearchResult[]> {
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(count, 10)));

  const response = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave Search API error ${response.status}`);
  }

  const data = await response.json();

  if (!data.web?.results) {
    return [];
  }

  return data.web.results.map((item: any) => ({
    name: item.title || '',
    snippet: item.description || '',
    url: item.url || '',
  }));
}
