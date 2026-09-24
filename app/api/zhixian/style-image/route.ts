import { NextRequest } from 'next/server';
import { initCredits, spendCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';
import { isConfigured, generateStyleImage } from '@/lib/zhixian/dashscope';
import { STARS } from '@/lib/zhixian/stars';

const DEFAULT_COST = 3;
const MAX_IMAGE_CHARS = 5_500_000;

function parseCost(): number {
  const v = Number.parseInt(process.env.ZHIXIAN_STYLE_CREDIT_COST || '', 10);
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_COST;
  return Math.min(v, 100);
}

function buildPrompt(name: string): string {
  const star = STARS.find((s) => s.name === name);
  if (!star) return '自然写实的喜剧明星同款造型，保持人物面部五官不变。';
  const dims = (star.dims || []).join('、');
  return '参考中国喜剧明星' + star.name + '的经典造型（' + star.tag + '），给照片中的人换一个同款发型、眉形和服装，调整神态气质，突出' + dims + '。保持人物面部五官和身份不变，自然写实、生活化，喜剧明星同款气质。';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const image = (body?.image as string) || '';
    const starName = (body?.starName as string) || '';

    if (!isConfigured()) {
      return Response.json({ success: false, error: '图像生成服务未配置' }, { status: 503 });
    }
    if (!/^data:image\/(jpe?g|png|webp);base64,/i.test(image)) {
      return Response.json({ success: false, error: '图片格式不支持' }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return Response.json({ success: false, error: '图片过大，请压缩后重试' }, { status: 413 });
    }

    const userId = getUserIdFromRequest(request);
    const cost = parseCost();
    if (userId) {
      await initCredits(userId);
      const ok = await spendCredits(userId, cost);
      if (!ok) {
        return Response.json(
          { success: false, code: 'INSUFFICIENT_CREDITS', error: '积分不足，请充值', cost },
          { status: 402 },
        );
      }
    }

    const prompt = buildPrompt(starName);
    const url = await generateStyleImage(image, prompt);
    return Response.json({ success: true, url, cost });
  } catch (error) {
    console.error('zhixian style-image error:', error);
    return Response.json({ success: false, error: '造型图生成失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, cost: parseCost(), configured: isConfigured() });
}
