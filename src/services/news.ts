const API_KEY = "344803106a0d445eadff26b513d50675";

export type NewsItem = {
  title: string;
  url: string;
  image?: string;
  source?: string;
  publishedAt?: string;
};

export async function fetchNews(params?: {
  q?: string;
  qInTitle?: string;
  pageSize?: number;
  language?: string;
  domains?: string[];
}): Promise<NewsItem[]> {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_NEWS_API_KEY. Set it in your environment.');
  }
  const q = params?.q ? encodeURIComponent(params.q) : undefined;
  const qInTitle = encodeURIComponent(params?.qInTitle || 'cancer OR oncology');
  const pageSize = params?.pageSize ?? 8;
  const language = params?.language || 'en';
  const domains = (params?.domains && params.domains.length > 0
    ? params.domains
    : [
        'reuters.com',
        'apnews.com',
        'bbc.com',
        'nytimes.com',
        'theguardian.com',
        'nature.com',
        'cancer.gov',
        'who.int',
        'medicalnewstoday.com',
        'healthline.com',
      ]).join(',');
  const base = 'https://newsapi.org/v2/everything';
  const url = `${base}?qInTitle=${qInTitle}${q ? `&q=${q}` : ''}&language=${language}&domains=${domains}&sortBy=publishedAt&pageSize=${pageSize}`;
  const res = await fetch(url, {
    headers: { 'X-Api-Key': API_KEY },
  });
  if (!res.ok) {
    let msg = `NewsAPI error ${res.status}`;
    try {
      const data = await res.json();
      msg += `: ${JSON.stringify(data)}`;
    } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  const items = (data?.articles || []).map((a: any) => ({
    title: a?.title,
    url: a?.url,
    image: a?.urlToImage,
    source: a?.source?.name,
    publishedAt: a?.publishedAt,
  })) as NewsItem[];
  return items;
}
