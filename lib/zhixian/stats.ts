import { kvIncr, kvSadd } from '@/lib/kv-store';

// 仙人指路专属统计埋点。独立于全站统计（stats:*），键统一用 zx:* 前缀。
function dayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}

// 页面访问（PV + UV）。
export async function trackVisit(uid: string): Promise<void> {
  const d = dayStr();
  await kvIncr('zx:visit:total', 1);
  await kvIncr('zx:visit:' + d, 1);
  await kvSadd('zx:uv:all', uid);
  await kvSadd('zx:uv:' + d, uid);
}

// 发起一次匹配。paid = 是否为付费（第3次起扣积分）。
export async function trackMatch(paid: boolean): Promise<void> {
  const d = dayStr();
  await kvIncr('zx:match:total', 1);
  await kvIncr('zx:match:' + d, 1);
  await kvIncr(paid ? 'zx:match:paid:total' : 'zx:match:free:total', 1);
}

// 付费解锁一次完整指路卡。
export async function trackUnlock(): Promise<void> {
  const d = dayStr();
  await kvIncr('zx:unlock:total', 1);
  await kvIncr('zx:unlock:' + d, 1);
}
