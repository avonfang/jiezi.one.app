import { kvIncr } from './kv-store';

// 充值成功统计（营收口径）。在订单确认成功时调用，与支付渠道无关。
export async function trackRecharge(cents: number, credits: number): Promise<void> {
  await kvIncr('revenue:orders:total', 1);
  await kvIncr('revenue:amount:total', Math.max(0, cents));
  await kvIncr('revenue:credits:total', Math.max(0, credits));
}

// 解析价格字符串（如 '¥6.90' / '6.9'）为「分」。
export function priceToCents(price: string): number {
  const n = parseFloat(String(price).replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}
