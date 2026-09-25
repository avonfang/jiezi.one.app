import { STARS, type Star } from './stars';
import { isConfigured, searchFaces } from './tencent-face';
import {
  isConfigured as isBaiduConfigured,
  recognizeCelebrities as baiduRecognize,
  type BaiduCelebrity,
} from './baidu-celebrity';
import {
  isConfigured as isBosConfigured,
  recognizeCelebrities as bosRecognize,
  type BosCelebrity,
} from './bos-celebrity';

export type MatchResponse = {
  mock: boolean;
  top3: Star[];
  engine?: 'tencent' | 'bos' | 'baidu' | 'mock';
};

const GROUP_ID = process.env.TENCENT_FACE_GROUP_ID || 'zhixian_stars_v1';

function probabilityToPct(p: number): number {
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

// 腾讯云 SearchFaces 的 Score 是 0~100 的绝对相似度：
// 同一人/极像 -> 80~100；普通素人 vs 明星库 -> 通常只有 15~40。
// 为了让「库内相对最像」的结果好看且保持真实排序，做温和映射。
function calibrateTencentScore(score: number, rank: number): number {
  if (score >= 75) return Math.max(1, Math.min(99, Math.round(score)));
  const anchors = [82, 70, 60];
  const base = anchors[rank] ?? 60;
  const wave = Math.round((score / 80) * 4) - 2; // -2 .. +2
  return Math.max(1, Math.min(99, base + wave));
}

function byName(name: string): Star | undefined {
  const n = name.trim();
  const exact = STARS.find((s) => s.name === n);
  if (exact) return exact;
  return STARS.find((s) => n.includes(s.name) || s.name.includes(n));
}

function celebritiesToStars(
  celebrities: Array<{ name: string; starId?: string; probability: number }>,
): Star[] {
  const out: Star[] = [];
  for (const c of celebrities) {
    const local = byName(c.name);
    if (local) {
      if (!out.some((s) => s.id === local.id)) {
        out.push({ ...local, pct: probabilityToPct(c.probability) });
      }
    } else {
      out.push({
        id: 'ext_' + (c.starId || encodeURIComponent(c.name)),
        name: c.name,
        tag: '云端明星识别',
        pct: probabilityToPct(c.probability),
        dims: ['脸型轮廓', '五官比例', '整体气质'],
        desc: `你的面部风格与该公众人物相似度约 ${probabilityToPct(c.probability)}%，可参考其造型与神态进行模仿创作。`,
      });
    }
  }
  return out.slice(0, 3);
}

// 腾讯云人脸搜索：在自建 30 人明星库里做 1:N 检索，返回「库内最像」Top3。
async function tryTencent(imageBase64: string): Promise<MatchResponse | null> {
  if (!isConfigured()) return null;
  try {
    const candidates = await searchFaces(GROUP_ID, imageBase64, 8);
    const byId = new Map(STARS.map((s) => [s.id, s]));
    const top3: Star[] = [];
    const seen = new Set<string>();
    for (const c of candidates) {
      if (seen.has(c.personId)) continue;
      seen.add(c.personId);
      const star = byId.get(c.personId);
      if (!star) continue;
      const pct = calibrateTencentScore(c.score, top3.length);
      top3.push({ ...star, pct });
      if (top3.length >= 3) break;
    }
    if (top3.length) return { mock: false, top3, engine: 'tencent' };
  } catch (e) {
    console.error('tencent face search error:', e);
  }
  return null;
}

async function tryBos(imageBase64: string): Promise<MatchResponse | null> {
  if (!isBosConfigured()) return null;
  try {
    const celebrities = await bosRecognize(imageBase64);
    const top3 = celebritiesToStars(celebrities as BosCelebrity[]);
    if (top3.length) return { mock: false, top3, engine: 'bos' };
  } catch (e) {
    console.error('bos celebrity error:', e);
  }
  return null;
}

async function tryBaidu(imageBase64: string): Promise<MatchResponse | null> {
  if (!isBaiduConfigured()) return null;
  try {
    const celebrities = await baiduRecognize(imageBase64);
    const top3 = celebritiesToStars(celebrities as BaiduCelebrity[]);
    if (top3.length) return { mock: false, top3, engine: 'baidu' };
  } catch (e) {
    console.error('baidu celebrity error:', e);
  }
  return null;
}

export async function matchTop3(imageBase64: string): Promise<MatchResponse> {
  // 1) 腾讯云人脸库 1:N 检索（自建 30 位喜剧明星库，结果都在库内、带照片）
  const tencent = await tryTencent(imageBase64);
  if (tencent) return tencent;

  // 2) BOS 公众人物识别（全网名人，作为兜底）
  const bos = await tryBos(imageBase64);
  if (bos) return bos;

  // 3) 百度内容审核公众人物识别（旧引擎）
  const baidu = await tryBaidu(imageBase64);
  if (baidu) return baidu;

  // 4) 兜底演示数据
  return mockTop3();
}

function mockTop3(): MatchResponse {
  const start = Math.floor(Math.random() * STARS.length);
  const base = [87, 74, 61];
  const top3: Star[] = Array.from({ length: 3 }, (_, i) => {
    const s = STARS[(start + i) % STARS.length];
    return { ...s, pct: Math.min(99, base[i] + Math.floor(Math.random() * 4)) };
  });
  return { mock: true, top3, engine: 'mock' };
}

