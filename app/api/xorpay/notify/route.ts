import { NextRequest } from 'next/server';
import { verifyNotifySign } from '@/lib/xorpay';
import { confirmOrder } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const aoid = (formData.get('aoid') as string) || '';
    const orderId = (formData.get('order_id') as string) || '';
    const payPrice = (formData.get('pay_price') as string) || '';
    const payTime = (formData.get('pay_time') as string) || '';
    const sign = (formData.get('sign') as string) || '';

    if (!aoid || !orderId || !payPrice || !sign) {
      console.error('XORPay notify: missing parameters');
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
