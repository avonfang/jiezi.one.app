import { STARS, type Star } from './stars';
import { isConfigured, searchFaces } from './tencent-face';

export type MatchResponse = {
  mock: boolean;
  top3: Star[];
};

const GROUP_ID = process.env.TENCENT_FACE_GROUP_ID || 'zhixian_stars_v1';

function scoreToPct(score: number): number {
  // 腾讯 Score 是 0-100 置信度（70≈1%误识、80≈0.1%、90≈0.01%），先粗映射为展示分，后续标定。
  return Math.max(0, Math.min(99, Math.round(score)));
}

export async function matchTop3(imageBase64: string): Promise<MatchResponse> {
  if (isConfigured()) {
    try {
      const candidates = await searchFaces(GROUP_ID, imageBase64, 3);
      const byId = new Map(STARS.map((s) => [s.id, s]));
      const top3: Star[] = [];
      for (const c of candidates) {
        const star = byId.get(c.personId);
        if (star) top3.push({ ...star, pct: scoreToPct(c.score) });
        if (top3.length >= 3) break;
      }
      if (top3.length) return { mock: false, top3 };
    } catch (e) {
      console.error('tencent face search error:', e);
    }
  }
  return mockTop3();
}

function mockTop3(): MatchResponse {
  const start = Math.floor(Math.random() * STARS.length);
  const base = [87, 74, 61];
  const top3: Star[] = Array.from({ length: 3 }, (_, i) => {
    const s = STARS[(start + i) % STARS.length];
    return { ...s, pct: Math.min(99, base[i] + Math.floor(Math.random() * 4)) };
  });
  return { mock: true, top3 };
}
