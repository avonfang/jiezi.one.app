import { NextRequest } from 'next/server';
import { listOrders } from '@/lib/orders';
import { checkAdminAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return Response.json({ error: '未授权' }, { status: 401 });
  }
  try {
    const orders = await listOrders();
    return Response.json({ orders });
  } catch {
    return Response.json({ orders: [] });
  }
}
