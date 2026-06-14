import { NextRequest } from 'next/server';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';
import { dataDir } from '@/lib/data-dir';

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('order_id');
  if (!orderId) {
    return Response.json({ error: '缺少订单编号' }, { status: 400 });
  }

  try {
    const ORDERS_DIR = dataDir('orders');
    const filePath = path.join(ORDERS_DIR, `${orderId}.json`);

    if (!existsSync(filePath)) {
      return Response.json({ error: '订单不存在' }, { status: 404 });
    }

    const raw = await readFile(filePath, 'utf-8');
    const order = JSON.parse(raw);

    return Response.json({
      status: order.status,
      confirmed: order.status === 'confirmed',
      plan: order.plan,
      credits: order.credits,
      created_at: order.created_at,
      confirmed_at: order.confirmed_at || null,
    });
  } catch (error) {
    console.error('XORPay query error:', error);
    return Response.json({ error: '查询失败' }, { status: 500 });
  }
}
