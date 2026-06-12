import { NextRequest } from 'next/server';
import { confirmOrder } from '@/lib/orders';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body as { orderId: string };
    if (!orderId) return Response.json({ error: '缺少订单编号' }, { status: 400 });

    const ok = await confirmOrder(orderId);
    if (!ok) return Response.json({ error: '订单不存在或已处理' }, { status: 400 });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Order confirm error:', error);
    return Response.json({ error: '确认失败' }, { status: 500 });
  }
}
