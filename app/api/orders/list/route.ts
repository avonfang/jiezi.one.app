import { listOrders } from '@/lib/orders';

export async function GET() {
  try {
    const orders = await listOrders();
    return Response.json({ orders });
  } catch {
    return Response.json({ orders: [] });
  }
}
