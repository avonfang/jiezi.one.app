import { createHmac } from 'node:crypto';
import { ProxyAgent } from 'undici';

// 百度智能云 BOS「图像审核-公众人物识别(public)」：真正的 TopN 相似度匹配，
// 任何照片都会返回最相似的公众人物 + probability(0~1)，比内容审核 v2 更准。
// 流程：PUT 上传图片到 Bucket -> POST /<ObjectName>?process 调公众人物识别 -> 解析 stars[]。

export type BosCelebrity = {
  name: string;
  starId?: string;
  probability: number; // 0 ~ 1 相似度
};

const AK = process.env.BOS_AK || '';
const SK = process.env.BOS_SK || '';
const BUCKET = process.env.BOS_BUCKET || '';
const REGION = process.env.BOS_REGION || 'bj';
const EXPIRATION = '1800';

const host = (): string => `${BUCKET}.${REGION}.bcebos.com`;

let proxyAgent: ProxyAgent | null = null;
function dispatcher(): { dispatcher: ProxyAgent } | Record<string, never> {
  const proxy = process.env.BOS_HTTP_PROXY || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (!proxy) return {};
  if (!proxyAgent) proxyAgent = new ProxyAgent({ uri: proxy });
  return { dispatcher: proxyAgent };
}

export function isConfigured(): boolean {
  return !!(AK && SK && BUCKET);
}

// RFC 3986 编码：非保留字符(A-Z a-z 0-9 - _ . ~)不变，其余 %XX 大写；斜杠可选编码。
function uriEncode(str: string, encodeSlash = true): string {
  const bytes = new TextEncoder().encode(str);
  let out = '';
  for (const b of bytes) {
    const ch = String.fromCharCode(b);
    if (
      (b >= 0x41 && b <= 0x5a) ||
      (b >= 0x61 && b <= 0x7a) ||
      (b >= 0x30 && b <= 0x39) ||
      ch === '-' || ch === '_' || ch === '.' || ch === '~'
    ) {
      out += ch;
    } else if (ch === '/' && !encodeSlash) {
      out += '/';
    } else {
      out += '%' + b.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return out;
}

function hmacHex(key: string, msg: string): string {
  return createHmac('sha256', key).update(msg).digest('hex');
}

// 生成 bce-auth-v1 认证字符串。仅签名 host 与 x-bce-date（显式填写 signedHeaders）。
function sign(method: string, path: string, query: string): { authorization: string; xBceDate: string } {
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const authPrefix = `bce-auth-v1/${AK}/${ts}/${EXPIRATION}`;

  const canonicalURI = uriEncode(path, false);
  const canonicalQuery = query ? uriEncode(query, true) + '=' : '';

  const signed: Array<[string, string]> = [
    ['host', host()],
    ['x-bce-date', ts],
  ].map(([n, v]) => [n.toLowerCase(), String(v).trim()] as [string, string])
   .sort((a, b) => a[0].localeCompare(b[0]));

  const canonicalHeaders = signed
    .map(([n, v]) => uriEncode(n, true) + ':' + uriEncode(v, true))
    .join('\n');
  const signedHeaders = signed.map(([n]) => n).join(';');

  const canonicalRequest = method.toUpperCase() + '\n' + canonicalURI + '\n' + canonicalQuery + '\n' + canonicalHeaders;
  const signingKey = hmacHex(SK, authPrefix);
  const signature = hmacHex(signingKey, canonicalRequest);

  return {
    authorization: `${authPrefix}/${signedHeaders}/${signature}`,
    xBceDate: ts,
  };
}

// 从 data URI 解析出 mime 与纯 base64，映射出扩展名。
function parseImage(dataUri: string): { mime: string; ext: string; buffer: Uint8Array } {
  const m = /^data:(image\/(?:jpe?g|png|webp));base64,([\s\S]*)$/i.exec(dataUri);
  if (!m) throw new Error('不支持的图片格式');
  const mime = m[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : m[1].toLowerCase();
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const raw = Buffer.from(m[2], 'base64');
  const buffer = new Uint8Array(new ArrayBuffer(raw.byteLength));
  buffer.set(raw);
  return { mime, ext, buffer };
}

/**
 * 调用 BOS 公众人物识别，返回按相似度降序的公众人物列表。
 */
export async function recognizeCelebrities(imageBase64: string): Promise<BosCelebrity[]> {
  if (!isConfigured()) throw new Error('未配置 BOS 凭据');
  const { mime, ext, buffer } = parseImage(imageBase64);
  const objectName = `zhixian-uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = '/' + objectName;

  // 1) 上传图片
  {
    const sig = sign('PUT', path, '');
    const res = await fetch(`https://${host()}${path}`, {
      method: 'PUT',
      headers: {
        Host: host(),
        'x-bce-date': sig.xBceDate,
        'Content-Type': mime,
        Authorization: sig.authorization,
      },
      body: buffer as unknown as BodyInit,
      ...dispatcher(),
    });
    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`BOS 上传失败: ${res.status} ${text}`);
    }
  }

  // 2) 调用公众人物识别
  try {
    const param = JSON.stringify({ public: { max_face_num: 1, max_star_num: 4 } });
    const body = JSON.stringify({
      action: { sync: [{ url: '$(img-censor)', parameters: Buffer.from(param).toString('base64') }] },
    });
    const sig = sign('POST', path, 'process');
    const res = await fetch(`https://${host()}${path}?process`, {
      method: 'POST',
      headers: {
        Host: host(),
        'x-bce-date': sig.xBceDate,
        'Content-Type': 'application/json',
        Authorization: sig.authorization,
      },
      body,
      ...dispatcher(),
    });
    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`BOS 图像审核失败: ${res.status} ${text}`);
    }
    const data = (await res.json()) as {
      result?: { public?: { result?: Array<{ stars?: Array<{ name?: string; star_id?: string; probability?: number }> }> } };
      error_code?: number;
      error_msg?: string;
    };
    if (data.error_code) {
      throw new Error(`BOS 图像审核错误: [${data.error_code}] ${data.error_msg || ''}`);
    }
    const faces = data?.result?.public?.result || [];
    const seen = new Set<string>();
    const out: BosCelebrity[] = [];
    for (const face of faces) {
      for (const s of face.stars || []) {
        if (!s?.name) continue;
        if (seen.has(s.name)) continue;
        seen.add(s.name);
        out.push({
          name: String(s.name),
          starId: s.star_id ? String(s.star_id) : undefined,
          probability: Number(s.probability) || 0,
        });
      }
    }
    return out
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 4);
  } finally {
    // 3) 清理临时图片（尽力而为，失败不影响结果）
    try {
      const sig = sign('DELETE', path, '');
      await fetch(`https://${host()}${path}`, {
        method: 'DELETE',
        headers: {
          Host: host(),
          'x-bce-date': sig.xBceDate,
          Authorization: sig.authorization,
        },
        ...dispatcher(),
      });
    } catch {
      // ignore
    }
  }
}


