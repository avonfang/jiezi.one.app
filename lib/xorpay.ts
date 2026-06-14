import { createHash, timingSafeEqual } from 'crypto';

export function getXorpayConfig() {
  const aid = process.env.XORPAY_AID;
  const appSecret = process.env.XORPAY_APP_SECRET;
  if (!aid || !appSecret) {
    throw new Error('XORPAY_AID and XORPAY_APP_SECRET must be set');
  }
  return { aid, appSecret };
}

/**
 * Generate sign for payment request.
 * Order: name + pay_type + price + order_id + notify_url + app_secret
 */
export function generatePaySign(
  params: { name: string; pay_type: string; price: string; order_id: string; notify_url: string },
  appSecret: string,
): string {
  const str = params.name + params.pay_type + params.price + params.order_id + params.notify_url + appSecret;
  return createHash('md5').update(str).digest('hex');
}

/**
 * Verify the sign from XORPay payment callback.
 * Order: aoid + order_id + pay_price + pay_time + app_secret
 */
export function verifyNotifySign(
  params: { aoid: string; order_id: string; pay_price: string; pay_time: string; sign: string },
  appSecret: string,
): boolean {
  const str = params.aoid + params.order_id + params.pay_price + params.pay_time + appSecret;
  const expected = createHash('md5').update(str).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const signBuf = Buffer.from(params.sign, 'hex');
  if (expectedBuf.length !== signBuf.length) return false;
  return timingSafeEqual(expectedBuf, signBuf);
}

/**
 * Create a payment order on XORPay.
 * Returns the API response with QR code URL.
 */
export async function createXorpayPayment(params: {
  name: string;
  pay_type: string; // 'native' | 'alipay' | 'cashier' | 'jsapi'
  price: string;
  order_id: string;
  notify_url: string;
  return_url?: string;
  more?: string;
}) {
  const { aid, appSecret } = getXorpayConfig();
  const sign = generatePaySign(
    { name: params.name, pay_type: params.pay_type, price: params.price, order_id: params.order_id, notify_url: params.notify_url },
    appSecret,
  );

  const formData = new URLSearchParams();
  formData.append('name', params.name);
  formData.append('pay_type', params.pay_type);
  formData.append('price', params.price);
  formData.append('order_id', params.order_id);
  formData.append('notify_url', params.notify_url);
  if (params.return_url) formData.append('return_url', params.return_url);
  if (params.more) formData.append('more', params.more);
  formData.append('sign', sign);

  const res = await fetch(`https://xorpay.com/api/pay/${aid}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  return res.json() as Promise<{
    status: string;
    aoid?: string;
    expire_in?: number;
    info?: { qr?: string; url?: string };
  }>;
}
