import { NextRequest } from 'next/server';
import { createOrder } from '@/lib/orders';

const PLANS: Record<string, { credits: number; price: string }> = {
  basic: { credits: 7, price: '¥6.90' },
  standard: { credits: 15, price: '¥12.90' },
  premium: { credits: 35, price: '¥29.90' },
  topup_small: { credits: 3, price: '¥2.90' },
  topup_large: { credits: 5, price: '¥3.90' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, userId, transactionId } = body as { plan: string; userId: string; transactionId: string };

    const cfg = PLANS[plan];
    if (!cfg) return Response.json({ error: '无效的套餐' }, { status: 400 });
    if (!userId) return Response.json({ error: '缺少用户标识' }, { status: 400 });
    if (!transactionId || transactionId.length < 4) {
      return Response.json({ error: '请填写交易单号后 4 位' }, { status: 400 });
    }

    const order = await createOrder(userId, plan, cfg.credits, cfg.price, transactionId);
    return Response.json({ success: true, orderId: order.id });
  } catch (error) {
    console.error('Order create error:', error);
    return Response.json({ error: '提交失败' }, { status: 500 });
  }
}
