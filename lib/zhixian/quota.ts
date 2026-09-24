import { kvGet, kvSet } from '@/lib/kv-store';

// 免费测试次数与单次测试积分消耗。
export const FREE_TEST_LIMIT = 2;
export const TEST_COST = 1;

function countKey(userId: string) {
  return 'zhixian:testcount:' + userId;
}

export async function getFreeTestUsed(userId: string): Promise<number> {
  const n = await kvGet<number>(countKey(userId));
  return typeof n === 'number' ? n : 0;
}

export async function freeTestRemaining(userId: string): Promise<number> {
  const used = await getFreeTestUsed(userId);
  return Math.max(0, FREE_TEST_LIMIT - used);
}

// 尝试消耗一次免费额度。返回是否享受了免费。
export async function consumeFreeTest(userId: string): Promise<{ free: boolean; used: number }> {
  const used = await getFreeTestUsed(userId);
  if (used < FREE_TEST_LIMIT) {
    await kvSet(countKey(userId), used + 1);
    return { free: true, used: used + 1 };
  }
  return { free: false, used };
}
