import { EnvHttpProxyAgent } from 'undici';

export type BaiduCelebrity = {
  name: string;
  starId?: string;
  probability: number; // 0 ~ 1 相似度
};

const TOKEN_URL = 'https://aip.baidubce.com/oauth/2.0/token';
// 百度「公众人物识别」实际挂在内容审核平台-图像接口下（非人脸识别 face/v3）。
const CENSOR_URL =
  'https://aip.baidubce.com/rest/2.0/solution/v1/img_censor/v2/user_defined';

let cachedToken: { token: string; expiresAt: number } | null = null;
let proxyAgent: EnvHttpProxyAgent | null = null;

function dispatcher(): { dispatcher: EnvHttpProxyAgent } | Record<string, never> {
  const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return {};
  if (!proxyAgent) proxyAgent = new EnvHttpProxyAgent();
  return { dispatcher: proxyAgent };
}

export function isConfigured(): boolean {
  return !!(process.env.BAIDU_API_KEY && process.env.BAIDU_SECRET_KEY);
}

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.BAIDU_API_KEY!;
  const secretKey = process.env.BAIDU_SECRET_KEY!;
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const url =
    TOKEN_URL +
    '?grant_type=client_credentials&client_id=' +
    encodeURIComponent(apiKey) +
    '&client_secret=' +
    encodeURIComponent(secretKey);

  const res = await fetch(url, { method: 'POST', ...dispatcher() });
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!data.access_token) {
    throw new Error(
      `百度 access_token 获取失败: ${data.error || res.status} ${data.error_description || ''}`,
    );
  }
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 2_592_000) * 1000,
  };
  return cachedToken.token;
}

/**
 * 调用百度内容审核-公众人物识别，返回最相似的公众人物及其相似度。
 * 返回字段为 data[].stars[]：{ name, probability }，type=39 为公众人物（type=5 为旧版人物库-公众人物）。
 */
export async function recognizeCelebrities(imageBase64: string): Promise<BaiduCelebrity[]> {
  const token = await getAccessToken();
  const image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const body = new URLSearchParams({ image });

  const res = await fetch(`${CENSOR_URL}?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    ...dispatcher(),
  });
  const data = (await res.json()) as {
    error_code?: number;
    error_msg?: string;
    data?: Array<{ type?: number; stars?: Array<{ name?: string; star_id?: string; probability?: number }> }>;
  };

  if (data.error_code) {
    // error_code 6 = 应用未开通内容审核/公众人物识别权限
    throw new Error(`百度公众人物识别失败: [${data.error_code}] ${data.error_msg || ''}`);
  }

  const items = Array.isArray(data.data) ? data.data : [];
  const stars: BaiduCelebrity[] = [];
  for (const item of items) {
    if (item.type !== 39 && item.type !== 5) continue;
    const list = Array.isArray(item.stars) ? item.stars : [];
    for (const s of list) {
      if (s?.name) {
        stars.push({
          name: String(s.name),
          starId: s.star_id ? String(s.star_id) : undefined,
          probability: Number(s.probability) || 0,
        });
      }
    }
  }

  const seen = new Set<string>();
  const out: BaiduCelebrity[] = [];
  for (const s of stars.sort((a, b) => b.probability - a.probability)) {
    if (seen.has(s.name)) continue;
    seen.add(s.name);
    out.push(s);
  }
  return out.slice(0, 3);
}
