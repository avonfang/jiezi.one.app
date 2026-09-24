import { STARS, type Star } from './stars';
import { isConfigured, searchFaces } from './tencent-face';
import {
  isConfigured as isBaiduConfigured,
  recognizeCelebrities,
  type BaiduCelebrity,
} from './baidu-celebrity';

export type MatchResponse = {
  mock: boolean;
  top3: Star[];
  engine?: 'baidu' | 'tencent' | 'mock';
};

const GROUP_ID = process.env.TENCENT_FACE_GROUP_ID || 'zhixian_stars_v1';
// 腾讯人员库置信度阈值（0-100），低于此值视为无有效相似结果。
const TENCENT_MIN_SCORE = 75;

function scoreToPct(score: number): number {
  // 腾讯 Score 是 0-100 置信度，先粗映射为展示分，后续标定。
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

function baiduToStars(celebrities: BaiduCelebrity[]): Star[] {
  const out: Star[] = [];
  for (const c of celebrities) {
    const local = byName(c.name);
    if (local) {
      if (!out.some((s) => s.id === local.id)) out.push({ ...local, pct: probabilityToPct(c.probability) });
    } else {
      out.push({
        id: 'bd_' + (c.starId || encodeURIComponent(c.name)),
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

async function tryBaidu(imageBase64: string): Promise<MatchResponse | null> {
  if (!isBaiduConfigured()) return null;
  try {
    const celebrities = await recognizeCelebrities(imageBase64);
    const top3 = baiduToStars(celebrities);
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
      // 腾讯人员库目前只有极少量明星，低于阈值的结果没有参考价值，直接丢弃。
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
  // 1) 百度公众人物识别（内置明星库，优先）
  const baidu = await tryBaidu(imageBase64);
  if (baidu) return baidu;

  // 2) 腾讯云人脸搜索（自有人员库）
  const tencent = await tryTencent(imageBase64);
  if (tencent) return tencent;

  // 3) 兜底演示数据
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
