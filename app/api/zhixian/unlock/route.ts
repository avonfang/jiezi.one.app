import { NextRequest } from 'next/server';
import { initCredits, spendCreditsOnce } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

const DEFAULT_UNLOCK_COST = 60;

function parseCost(): number {
  const value = Number.parseInt(process.env.ZHIXIAN_UNLOCK_CREDIT_COST || '', 10);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_UNLOCK_COST;
  return Math.min(value, 1000);
}

function parseResultId(value: unknown): string {
  const resultId = typeof value === 'string' ? value.trim() : '';
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(resultId)) return '';
  return resultId;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const resultId = parseResultId(body?.resultId);
    if (!resultId) {
      return Response.json(
        { success: false, error: '结果标识无效' },
        { status: 400 },
      );
    }

    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return Response.json(
        { success: false, error: '缺少用户标识' },
        { status: 400 },
      );
    }

    const cost = parseCost();
    await initCredits(userId);
    const balance = await spendCreditsOnce(
      userId,
      cost,
      `zhixian-unlock:${userId}:${resultId}`,
    );

    if (balance < 0) {
      return Response.json(
        {
          success: false,
          error: '积分不足，请充值',
          code: 'INSUFFICIENT_CREDITS',
          cost,
        },
        { status: 402 },
      );
    }

    return Response.json({
      success: true,
      balance,
      cost,
      resultId,
    });
  } catch (error) {
    console.error('zhixian unlock error:', error);
    return Response.json(
      { success: false, error: '解锁失败，请稍后再试' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return Response.json({ success: true, cost: parseCost() });
}
