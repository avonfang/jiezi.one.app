import { NextRequest } from 'next/server';
import { initCredits, spendCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';
import { limitCostlyRequest } from '@/lib/rate-limit';
import { isConfigured as isFusionConfigured, isConfiguredForStar, fuseFace } from '@/lib/zhixian/facefusion';
import { isConfigured as isDashscopeConfigured, generateStyleImage } from '@/lib/zhixian/dashscope';
import { STARS } from '@/lib/zhixian/stars';
import { parseImageSize } from '@/lib/zhixian/image-size';

export const maxDuration = 60; // 生成较慢，放宽函数超时

const DEFAULT_COST = 6;
const MAX_IMAGE_CHARS = 5_500_000;

function parseCost(): number {
  const v = Number.parseInt(process.env.ZHIXIAN_STYLE_CREDIT_COST || '', 10);
  if (!Number.isFinite(v) || v <= 0) return DEFAULT_COST;
  return Math.min(v, 100);
}

function starIdByName(name: string): string {
  return STARS.find((s) => s.name === name)?.id || '';
}

// DashScope 改妆提示词（换脸未配置时的兜底）
function buildPrompt(name: string): string {
  const star = STARS.find((s) => s.name === name);
  if (!star) return '保持人物五官、脸型和身份完全不变，做自然写实的喜剧明星同款造型。';
  const d0 = star.dims?.[0] || '脸型轮廓';
  const d1 = star.dims?.[1] || '眼型弧度';
  return (
    '保持人物的五官、脸型和身份完全不变，只做喜剧明星「' + star.name + '」同款造型：' +
    '调整发型做出「' + d0 + '」的轮廓感，眉形突出「' + d1 + '」，服装用深色或大地色。自然写实、生活化。'
  );
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return Response.json({ success: false, error: '请先登录或刷新页面' }, { status: 401 });
    const limited = await limitCostlyRequest(request, 'zhixian-style-image', userId, 6);
    if (limited) return limited;
    const body = await request.json().catch(() => ({}));
    const image = (body?.image as string) || '';
    const starName = (body?.starName as string) || '';

    const fusionReady = isFusionConfigured();
    const dashscopeReady = isDashscopeConfigured();

    if (!fusionReady && !dashscopeReady) {
      return Response.json({ success: false, error: '图像生成服务未配置' }, { status: 503 });
    }

    // 基础校验（两种模式共用）
    if (!/^data:image\/(jpe?g|png|webp);base64,/i.test(image)) {
      return Response.json({ success: false, error: '图片格式不支持' }, { status: 400 });
    }
    const sz = parseImageSize(image);
    if (sz) {
      if (sz.width < 64 || sz.height < 64) {
        return Response.json({ success: false, error: '照片尺寸太小，请换一张更清晰的照片' }, { status: 400 });
      }
      if (sz.width > 4096 || sz.height > 4096) {
        return Response.json({ success: false, error: '照片尺寸过大（请用 4096px 以内的照片）' }, { status: 400 });
      }
    }
    if (image.length > MAX_IMAGE_CHARS) {
      return Response.json({ success: false, error: '图片过大，请压缩后重试' }, { status: 413 });
    }

    // 换脸模式：需要 jpg/png
    if (fusionReady) {
      const starId = starIdByName(starName);
      if (starId && !isConfiguredForStar(starId)) {
        return Response.json({ success: false, error: '该明星的经典造型素材尚未配置，请先在控制台上传' }, { status: 503 });
      }
      if (!/^data:image\/(jpe?g|png);base64,/i.test(image)) {
        return Response.json({ success: false, error: '换脸仅支持 JPG/PNG 照片，请重新上传' }, { status: 400 });
      }
      const cost = parseCost();
      await initCredits(userId);
      const ok = await spendCredits(userId, cost);
      if (!ok) {
        return Response.json({ success: false, code: 'INSUFFICIENT_CREDITS', error: '积分不足，请充值', cost }, { status: 402 });
      }
      const url = await fuseFace(image, starId);
      return Response.json({ success: true, url, cost, mode: 'facefusion' });
    }

    // DashScope 兜底：改妆模式
    const cost = parseCost();
    await initCredits(userId);
    const ok = await spendCredits(userId, cost);
    if (!ok) {
      return Response.json({ success: false, code: 'INSUFFICIENT_CREDITS', error: '积分不足，请充值', cost }, { status: 402 });
    }
    const prompt = buildPrompt(starName);
    const url = await generateStyleImage(image, prompt);
    return Response.json({ success: true, url, cost, mode: 'dashscope' });
  } catch (error) {
    console.error('zhixian style-image error:', error);
    const msg = error instanceof Error ? error.message : '';
    return Response.json({ success: false, error: msg || '造型图生成失败，请稍后重试' }, { status: 500 });
  }
}

export async function GET() {
  const fusionReady = isFusionConfigured();
  const dashscopeReady = isDashscopeConfigured();
  return Response.json({ success: true, cost: parseCost(), configured: fusionReady || dashscopeReady, mode: fusionReady ? 'facefusion' : 'dashscope' });
}
