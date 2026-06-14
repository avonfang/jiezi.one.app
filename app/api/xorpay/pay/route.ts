import { NextRequest } from 'next/server';
import { createOrder } from '@/lib/orders';
import { createXorpayPayment } from '@/lib/xorpay';

const PLANS: Record<string, { name: string; credits: number; price: string }> = {
  basic: { name: '体验装', credits: 7, price: '6.90' },
  standard: { name: '标准装', credits: 15, price: '12.90' },
  premium: { name: '畅享装', credits: 35, price: '29.90' },
  topup_small: { name: '积分加油包(3积分)', credits: 3, price: '2.90' },
  topup_large: { name: '积分加油包(5积分)', credits: 5, price: '3.90' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, userId, payType } = body as { plan: string; userId: string; payType: string };

    const cfg = PLANS[plan];
    if (!cfg) return Response.json({ error: '无效的套餐' }, { status: 400 });
    if (!userId) return Response.json({ error: '缺少用户标识' }, { status: 400 });

    const payTypeValue = payType === 'alipay' ? 'alipay' : 'native';

    // Create local pending order
    const order = await createOrder(userId, plan, cfg.credits, `¥${cfg.price}`, 'xorpay');

    // Build notify URL from the incoming request
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const notifyUrl = `${protocol}://${host}/api/xorpay/notify`;

    // Create payment on XORPay
    const result = await createXorpayPayment({
      name: `芥子 - ${cfg.name}`,
      pay_type: payTypeValue,
      price: cfg.price,
      order_id: order.id,
      notify_url: notifyUrl,
      more: JSON.stringify({ userId, plan }),
    });

    if (result.status !== 'ok') {
      console.error('XORPay create payment failed:', result.status);
      return Response.json({ error: `支付创建失败: ${result.status}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      orderId: order.id,
      aoid: result.aoid,
      qrCode: result.info?.qr || null,
      expireIn: result.expire_in || 7200,
    });
  } catch (error) {
    console.error('XORPay pay error:', error);
    return Response.json({ error: '支付创建失败' }, { status: 500 });
  }
}
