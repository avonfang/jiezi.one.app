import { NextRequest } from 'next/server';
import { verifyNotifySign } from '@/lib/xorpay';
import { confirmOrder } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    // XORPay sends application/x-www-form-urlencoded, not multipart
    const text = await request.text();
    const raw = new URLSearchParams(text);
    const aoid = raw.get('aoid') || '';
    const orderId = raw.get('order_id') || '';
    const payPrice = raw.get('pay_price') || '';
    const payTime = raw.get('pay_time') || '';
    const sign = raw.get('sign') || '';

    console.log(`XORPay notify received — order_id=${orderId}, aoid=${aoid}, pay_price=${payPrice}`);

    if (!aoid || !orderId || !payPrice || !sign) {
      console.error('XORPay notify: missing parameters, raw=' + text.slice(0, 300));
      return new Response('fail', { status: 400 });
    }

    // Verify signature
    const appSecret = process.env.XORPAY_APP_SECRET || '';
    if (!verifyNotifySign({ aoid, order_id: orderId, pay_price: payPrice, pay_time: payTime, sign }, appSecret)) {
      console.error('XORPay notify: invalid signature');
      return new Response('fail', { status: 400 });
    }

    // Confirm the order (adds credits)
    const ok = await confirmOrder(orderId, aoid);
    if (!ok) {
      // Order might already be confirmed
      console.log(`XORPay notify: order ${orderId} already confirmed or not found`);
    }

    // Return "success" to XORPay — they require HTTP 200 with body "success"
    return new Response('success');
  } catch (error) {
    console.error('XORPay notify error:', error);
    return new Response('fail', { status: 500 });
  }
}
