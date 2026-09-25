import { NextRequest } from 'next/server';
import { matchTop3 } from '@/lib/zhixian/matcher';
import { initCredits, spendCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';
import { consumeFreeTest, FREE_TEST_LIMIT, TEST_COST } from '@/lib/zhixian/quota';
import { trackMatch } from '@/lib/zhixian/stats';

// base64 图片大小上限（约 4MB），超出直接拒绝，保护函数实例。
const MAX_IMAGE_CHARS = 5_500_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const image = (body?.image as string) || '';
    const consentFaceSearch = body?.consentFaceSearch === true;

    // 默认关闭云端人脸匹配。只有服务端开关打开且用户单独同意后才处理照片。
    if (process.env.ZHIXIAN_FACE_MATCH_ENABLED !== 'true' || !consentFaceSearch) {
      return Response.json(
        { success: false, error: '云端风格匹配未开启或未获得单独同意' },
        { status: 403 },
      );
    }

    if (!image || typeof image !== 'string') {
      return Response.json({ success: false, error: '缺少图片' }, { status: 400 });
    }
    if (!/^data:image\/(jpe?g|png|webp);base64,/i.test(image)) {
      return Response.json({ success: false, error: '图片格式不支持' }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return Response.json({ success: false, error: '图片过大，请压缩后重试' }, { status: 413 });
    }

    // 免费额度 + 积分扣费：前 2 次免费，之后每次扣积分。
    const userId = getUserIdFromRequest(request);
    const quota = { freeRemaining: 0, paid: false, testCost: TEST_COST };
    if (userId) {
      await initCredits(userId);
      const consumed = await consumeFreeTest(userId);
      if (consumed.free) {
        quota.freeRemaining = Math.max(0, FREE_TEST_LIMIT - consumed.used);
      } else {
        const ok = await spendCredits(userId, TEST_COST);
        if (!ok) {
          return Response.json(
            {
              success: false,
              code: "INSUFFICIENT_CREDITS",
              error: "免费测试次数已用完，积分不足，请充值后继续",
              cost: TEST_COST,
            },
            { status: 402 },
          );
        }
        quota.paid = true;
        quota.freeRemaining = 0;
      }
    }

    const { mock, top3, engine } = await matchTop3(image);
    await trackMatch(quota.paid);
    return Response.json({ success: true, mock, top3, engine, quota });
  } catch (error) {
    console.error('zhixian match error:', error);
    return Response.json({ success: false, error: '匹配失败，请稍后重试' }, { status: 500 });
  }
}

