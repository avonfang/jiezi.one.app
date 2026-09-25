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
  engine?: 'bos' | 'baidu' | 'tencent' | 'mock';
};

const GROUP_ID = process.env.TENCENT_FACE_GROUP_ID || 'zhixian_stars_v1';
// 腾讯人员库置信度阈值（0-100），低于此值视为无有效相似结果。
const TENCENT_MIN_SCORE = 75;

function scoreToPct(score: number): number {
  return Math.max(1, Math.min(99, Math.round(score)));
}

function probabilityToPct(p: number): number {
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}

function byName(name: string): Star | undefined {
  const n = name.trim();
  const exact = STARS.find((s) => s.name === n);
  if (exact) return exact;
  return STARS.find((s) => n.includes(s.name) || s.name.includes(n));
}

// BOS / 百度公众人物识别结果 -> 本地明星库映射，未收录的明星用临时条目兜底。
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

async function tryBos(imageBase64: string): Promise<MatchResponse | null> {
  if (!isBosConfigured()) return null;
  try {
    const celebrities = await bosRecognize(imageBase64);
    const top3 = celebritiesToStars(celebrities);
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

async function tryTencent(imageBase64: string): Promise<MatchResponse | null> {
  if (!isConfigured()) return null;
  try {
    const candidates = await searchFaces(GROUP_ID, imageBase64, 3);
    const byId = new Map(STARS.map((s) => [s.id, s]));
    const top3: Star[] = [];
    for (const c of candidates) {
      if (c.score < TENCENT_MIN_SCORE) continue;
      const star = byId.get(c.personId);
      if (star) top3.push({ ...star, pct: scoreToPct(c.score) });
      if (top3.length >= 3) break;
    }
    if (top3.length) return { mock: false, top3, engine: 'tencent' };
  } catch (e) {
    console.error('tencent face search error:', e);
  }
  return null;
}

export async function matchTop3(imageBase64: string): Promise<MatchResponse> {
  // 1) BOS 公众人物识别（方案A：任何脸都返回最相似明星 + 相似度，最准）
  const bos = await tryBos(imageBase64);
  if (bos) return bos;

  // 2) 百度内容审核公众人物识别（旧引擎，仅明显像明星时才返回，作备选）
  const baidu = await tryBaidu(imageBase64);
  if (baidu) return baidu;

  // 3) 腾讯云人脸搜索（自有人员库，当前仅少量明星）
  const tencent = await tryTencent(imageBase64);
  if (tencent) return tencent;

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
