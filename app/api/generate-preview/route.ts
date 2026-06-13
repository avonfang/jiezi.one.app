import { NextRequest } from 'next/server';
import { chatCompletionStream } from '@/lib/deepseek';

const CONTEXT = `你是一个资深前端设计师。根据 PRD 为一个新产品生成精美的 Landing Page HTML，只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有任何其他文字。

设计要求：
1. 使用 Tailwind CSS CDN (https://cdn.tailwindcss.com)，单个 HTML 内完成
2. 产品官网风格（参考 Stripe / Notion / Linear 等现代产品的设计语言）
3. Hero 区：产品名 + 口号 + 精美背景（渐变/光晕）+ CTA "免费开始使用"
4. 功能介绍区：用卡片/网格展示核心功能，每张卡片有图标 emoji + 标题 + 描述
5. 目标用户区：简洁说明谁适合用
6. 页脚：品牌名 + 版权
7. 整体风格干净、现代、留白充足
8. 支持中文`;

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
