import { kvGet, kvSet } from './kv-store';
import { addCredits } from './credits';

const IDS_KEY = 'orders:ids';

interface OrderRecord {
  id: string;
  userId: string;
  plan: string;
  credits: number;
  price: string;
  transaction_id: string;
  xorpay_aoid?: string;
  status: 'pending' | 'confirmed';
  created_at: number;
  confirmed_at?: number;
}

function orderKey(id: string) {
  return `order:${id}`;
}

export async function createOrder(userId: string, plan: string, credits: number, price: string, transactionId: string): Promise<OrderRecord> {
  const order: OrderRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    userId,
    plan,
    credits,
    price,
    transaction_id: transactionId,
    status: 'pending',
    created_at: Date.now(),
  };

  await kvSet(orderKey(order.id), order);

  // Maintain order ID list
  const ids = await kvGet<string[]>(IDS_KEY) || [];
  ids.unshift(order.id);
  await kvSet(IDS_KEY, ids);

  return order;
}

export async function listOrders(): Promise<OrderRecord[]> {
  const ids = await kvGet<string[]>(IDS_KEY) || [];
  const orders: OrderRecord[] = [];
  for (const id of ids) {
    const order = await kvGet<OrderRecord>(orderKey(id));
    if (order) orders.push(order);
  }
  return orders;
}

export async function confirmOrder(orderId: string, xorpayAoid?: string): Promise<boolean> {
  const order = await kvGet<OrderRecord>(orderKey(orderId));
  if (!order || order.status !== 'pending') return false;
  order.status = 'confirmed';
  order.confirmed_at = Date.now();
  if (xorpayAoid) order.xorpay_aoid = xorpayAoid;
  await kvSet(orderKey(orderId), order);
  await addCredits(order.userId, order.credits);
  return true;
}
