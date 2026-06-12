import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { dataDir } from './data-dir';
import { addCredits } from './credits';

const ORDERS_DIR = dataDir('orders');

interface OrderRecord {
  id: string;
  userId: string;
  plan: string;
  credits: number;
  price: string;
  transaction_id: string;
  status: 'pending' | 'confirmed';
  created_at: number;
  confirmed_at?: number;
}

export async function createOrder(userId: string, plan: string, credits: number, price: string, transactionId: string): Promise<OrderRecord> {
  await mkdir(ORDERS_DIR, { recursive: true });
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
  await writeFile(path.join(ORDERS_DIR, `${order.id}.json`), JSON.stringify(order), 'utf-8');
  return order;
}

export async function listOrders(): Promise<OrderRecord[]> {
  if (!existsSync(ORDERS_DIR)) return [];
  const files = await readdir(ORDERS_DIR);
  const orders: OrderRecord[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const raw = await readFile(path.join(ORDERS_DIR, file), 'utf-8');
      orders.push(JSON.parse(raw));
    } catch { /* skip corrupt files */ }
  }
  return orders.sort((a, b) => b.created_at - a.created_at);
}

export async function confirmOrder(orderId: string): Promise<boolean> {
  const filePath = path.join(ORDERS_DIR, `${orderId}.json`);
  if (!existsSync(filePath)) return false;
  const raw = await readFile(filePath, 'utf-8');
  const order: OrderRecord = JSON.parse(raw);
  if (order.status !== 'pending') return false;
  order.status = 'confirmed';
  order.confirmed_at = Date.now();
  await writeFile(filePath, JSON.stringify(order), 'utf-8');
  await addCredits(order.userId, order.credits);
  return true;
}
