import { NextRequest } from 'next/server';
import { addCredits } from '@/lib/credits';
import { kvGet, kvSet } from '@/lib/kv-store';

export async function POST(request: NextRequest) {
  try {
    const { sharedBy } = await request.json();

    if (!sharedBy || typeof sharedBy !== 'string') {
      return Response.json({ error: '缺少分享者 ID' }, { status: 400 });
    }

    // Check if the referrer is a valid user
    const userExists = await kvGet(`auth:users:${sharedBy}`);
    if (!userExists) {
      return Response.json({ success: false, error: '无效的分享者' });
    }

    // Deduplicate: same referrer can only be credited once per recipient
    // Use the visitor's IP or a session marker to prevent abuse
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const dedupKey = `share-referrer:${sharedBy}:${ip}`;
    const alreadyCredited = await kvGet<boolean>(dedupKey);

    if (alreadyCredited) {
      return Response.json({ success: true, alreadyCredited: true });
    }

    const balance = await addCredits(sharedBy, 5);
    // Mark as credited (24h expiry)
    await kvSet(dedupKey, true);

    return Response.json({ success: true, balance, alreadyCredited: false });
  } catch (error) {
    console.error('Share referrer bonus error:', error);
    return Response.json({ error: '领取失败' }, { status: 500 });
  }
}
