import { NextRequest } from 'next/server';
import { chatCompletionStream } from '@/lib/deepseek';
import { initCredits, useCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

const CONTEXT = `你是一个资深前端设计师。根据 PRD 为一个新产品生成精美的 Landing Page HTML，只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有任何其他文字。

设计要求：
1. 使用标准 HTML + CSS（所有样式写在 <style> 标签内），不要引用任何外部 CSS 或 CDN。可辅以 Tailwind 类名（text-white, bg-gradient-to-br, rounded-2xl, shadow-lg, p-8, mx-auto 等），但核心样式必须内联且显式定义颜色/间距/圆角
2. 产品官网风格（参考 Stripe / Notion / Linear 等现代产品的设计语言）
3. Hero 区：产品名 + 口号 + 精美背景（渐变/光晕）+ CTA "免费开始使用"
4. 功能介绍区：用卡片/网格展示核心功能，每张卡片有图标 emoji + 标题 + 详细的展开说明（每张卡片至少 3-5 句描述，说明功能解决什么具体问题、如何运作、给用户带来的价值，要有场景感）
5. 目标用户区：简洁说明谁适合用
6. 页脚：品牌名 + 版权
7. 整体风格干净、现代、留白充足
8. 支持中文
9. 颜色、间距、圆角等视觉属性必须通过 CSS 显式设置，不要依赖任何框架默认值
10. 字体颜色在深色背景上必须显式设为白色或浅色，在浅色背景上设为深色`;

function buildPrompt(prd: any) {
  return `产品名称：${prd.product_name}
一句话描述：${prd.one_liner}
产品定位：${prd.positioning}
目标用户：${prd.target_users}
功能列表：${JSON.stringify(prd.features || [])}
建议定价：${prd.pricing_suggestion || ''}

请生成这个产品的 Landing Page HTML。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prd } = body;

    if (!prd) {
      return Response.json({ error: '缺少 PRD 数据' }, { status: 400 });
    }

    // Credit check — preview costs 3 credits
    const clientId = getUserIdFromRequest(request) || '';
    if (!clientId) {
      return Response.json({ error: '缺少用户标识' }, { status: 400 });
    }
    await initCredits(clientId);
    const deducted = await useCredits(clientId, 3);
    if (!deducted) {
      return Response.json(
        { error: '积分不足，请充值', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }

    // Support non-streaming mode for WeChat Mini Program
    const url = new URL(request.url);
    if (url.searchParams.get('mode') === 'json') {
      try {
        const preview = await generatePreview(prd);
        return Response.json({ success: true, preview });
      } catch (e) {
        return Response.json({ error: e instanceof Error ? e.message : '生成失败' }, { status: 500 });
      }
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };

        try {
          send({ type: 'progress', stage: 'designing', message: '分析 PRD 需求' });

          await new Promise(r => setTimeout(r, 300));

          send({ type: 'progress', stage: 'writing', message: '设计页面布局' });

          const streamStart = Date.now();
          const writingMessages = [
            '设计页面布局',
            '编写 Hero 区域',
            '构建功能展示区',
            '优化视觉风格',
            '调整响应式适配',
          ];

          let fullResponse = '';
          let lastHeartbeat = Date.now();
          for await (const token of chatCompletionStream([
            { role: 'system', content: CONTEXT },
            { role: 'user', content: buildPrompt(prd) },
          ], { temperature: 0.6, max_tokens: 8192 })) {
            fullResponse += token;
            const now = Date.now();
            if (now - lastHeartbeat > 3000) {
              const idx = Math.min(Math.floor((now - streamStart) / 3000) - 1, writingMessages.length - 1);
              send({ type: 'progress', stage: 'writing', message: writingMessages[idx] || writingMessages[writingMessages.length - 1] });
              lastHeartbeat = now;
            }
          }

          const htmlMatch = fullResponse.match(/<!-- HTML -->([\s\S]*)<!-- END -->/);
          const html = htmlMatch ? htmlMatch[1].trim() : fullResponse.trim();

          if (!html || html.length < 100) {
            throw new Error('生成的页面异常');
          }

          send({ type: 'result', preview: { html, product_name: prd.product_name } });
        } catch (e) {
          send({ type: 'error', message: e instanceof Error ? e.message : '生成失败' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/x-ndjson' },
    });
  } catch (error) {
    console.error('Preview generation error:', error);
    return Response.json({ error: '预览页生成出错了' }, { status: 500 });
  }
}

async function generatePreview(prd: any): Promise<{ html: string; product_name: string }> {
  let fullResponse = '';
  for await (const token of chatCompletionStream([
    { role: 'system', content: CONTEXT },
    { role: 'user', content: buildPrompt(prd) },
  ], { temperature: 0.6, max_tokens: 8192 })) {
    fullResponse += token;
  }
  const htmlMatch = fullResponse.match(/<!-- HTML -->([\s\S]*)<!-- END -->/);
  const html = htmlMatch ? htmlMatch[1].trim() : fullResponse.trim();
  if (!html || html.length < 100) throw new Error('生成的页面异常');
  return { html, product_name: prd.product_name };
}
