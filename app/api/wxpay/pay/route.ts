import { NextRequest } from 'next/server';
import { createOrder, confirmOrder } from '@/lib/orders';
import { createXorpayPayment, getXorpayConfig } from '@/lib/xorpay';
import { getWechatOpenid } from '@/lib/auth-server';

const PLANS: Record<string, { name: string; credits: number; price: string }> = {
  basic: { name: '体验装', credits: 7, price: '6.90' },
  standard: { name: '标准装', credits: 15, price: '12.90' },
  premium: { name: '畅享装', credits: 35, price: '29.90' },
  topup_small: { name: '小份加油', credits: 3, price: '2.90' },
  topup_large: { name: '大份加油', credits: 5, price: '3.90' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, userId } = body as { plan: string; userId: string };

    const cfg = PLANS[plan];
    if (!cfg) return Response.json({ error: '无效的套餐' }, { status: 400 });
    if (!userId) return Response.json({ error: '缺少用户标识' }, { status: 400 });

    // Demo mode: auto-confirm when WeChat Pay credentials are not configured
    const hasWeChatCreds = !!(process.env.WX_APPID && process.env.WX_SECRET);
    if (!hasWeChatCreds) {
      const order = await createOrder(userId, plan, cfg.credits, `¥${cfg.price}`, 'demo');
      await confirmOrder(order.id);
      console.log(`Demo mode: auto-confirmed order ${order.id} for user ${userId} (no WX_APPID)`);
      return Response.json({ success: true, orderId: order.id });
    }

    // Dev mode: auto-confirm when XORPay is not configured
    let xorpayConfigured = false;
    try { getXorpayConfig(); xorpayConfigured = true; } catch {}
    if (!xorpayConfigured) {
      const order = await createOrder(userId, plan, cfg.credits, `¥${cfg.price}`, 'dev');
      await confirmOrder(order.id);
      console.log(`Dev mode: auto-confirmed order ${order.id} for user ${userId}`);
      return Response.json({ success: true, orderId: order.id });
    }

    const openid = await getWechatOpenid(userId);
    if (!openid) {
      return Response.json({ error: '用户未绑定微信' }, { status: 400 });
    }

    const order = await createOrder(userId, plan, cfg.credits, `¥${cfg.price}`, 'wxpay');

    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const notifyUrl = `${protocol}://${host}/api/xorpay/notify`;

    // Try JSAPI first (works with real WeChat openid on real devices)
    const jsapiResult = await createXorpayPayment({
      name: `芥子 - ${cfg.name}`,
      pay_type: 'jsapi',
      price: cfg.price,
      order_id: order.id,
      notify_url: notifyUrl,
      openid,
      more: JSON.stringify({ userId, plan }),
    });

    if (jsapiResult.status === 'ok' && jsapiResult.info?.package) {
      return Response.json({
        success: true,
        orderId: order.id,
        payment: {
          timeStamp: jsapiResult.info.timeStamp,
          nonceStr: jsapiResult.info.nonceStr,
          package: jsapiResult.info.package,
          signType: jsapiResult.info.signType || 'MD5',
          paySign: jsapiResult.info.paySign,
        },
      });
    }

    // JSAPI failed — fall back to native QR code
    const nativeResult = await createXorpayPayment({
      name: `芥子 - ${cfg.name}`,
      pay_type: 'native',
      price: cfg.price,
      order_id: order.id,
      notify_url: notifyUrl,
      more: JSON.stringify({ userId, plan }),
    });

    if (nativeResult.status !== 'ok') {
      return Response.json({ error: '支付创建失败' }, { status: 500 });
    }

    return Response.json({
      success: true,
      orderId: order.id,
      qrCode: nativeResult.info?.qr || null,
      expireIn: nativeResult.expire_in || 7200,
    });
  } catch (error) {
    console.error('WXPay pay error:', error);
    return Response.json({ error: '支付创建失败' }, { status: 500 });
  }
}
