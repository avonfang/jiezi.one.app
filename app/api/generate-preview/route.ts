import { NextRequest } from 'next/server';
import { chatCompletionStream } from '@/lib/deepseek';
import { initCredits, useCredits } from '@/lib/credits';
import { getUserIdFromRequest } from '@/lib/get-user';

const CONTEXT = `你是一个资深前端设计师。根据 PRD 为一个新产品生成精美的 Landing Page HTML，只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有任何其他文字。

设计要求：
1. 纯 HTML + CSS，所有样式写在 <style> 标签内并显式定义每一个属性。严禁使用 Tailwind、Bootstrap 等 CSS 框架的类名，严禁引用任何外部 CSS、字体、CDN。页面必须不依赖任何外部资源即可完整渲染
2. 产品官网风格（参考 Stripe / Notion / Linear 等现代产品的设计语言）
3. Hero 区：产品名 + 口号 + 精美背景（渐变/光晕）+ CTA "免费开始使用"
4. 功能介绍区：用卡片/网格展示核心功能，每张卡片有图标 emoji + 标题 + 详细的展开说明（每张卡片至少 3-5 句描述，说明功能解决什么具体问题、如何运作、给用户带来的价值，要有场景感）
5. 目标用户区：简洁说明谁适合用
6. 页脚：品牌名 + 版权
7. 整体风格干净、现代、留白充足
8. 支持中文
9. 颜色、间距、圆角等视觉属性必须通过 CSS 显式设置，不要依赖任何框架默认值
10. 字体颜色在深色背景上必须显式设为白色或浅色，在浅色背景上设为深色
11. 在 <head> 中包含 <meta name="viewport" content="width=device-width, initial-scale=1.0">，适配手机屏幕
12. 移动端优先：核心样式（颜色、字体大小、间距、布局）在普通 CSS 规则中定义，@media 仅用于桌面端增强
13. CSS 选择器约束（非常重要）：
    - 只使用简单类选择器（.hero、.card-title）和标签选择器（h1、h2、p、div）
    - 禁止：后代选择器 .card p、子选择器 .card > p
    - 禁止：伪类 :hover、:nth-child、伪元素 ::before、::after
    - 禁止：属性选择器 [type=text]、ID选择器 #header、通配符 *
    - 每条规则一个选择器，禁止逗号分组（h1, h2 { ... } 须拆成两条）
    - 正确示例：.card { }  h1 { }  .feature-grid { }
    - 错误示例：.card p { }  h1, h2 { }  .card:hover { }  #header { }`;

function buildPrompt(prd: any) {
  return `产品名称：${prd.product_name}
一句话描述：${prd.one_liner}
产品定位：${prd.positioning}
目标用户：${prd.target_users}
功能列表：${JSON.stringify(prd.features || [])}
建议定价：${prd.pricing_suggestion || ''}

请生成这个产品的 Landing Page HTML。`;
}

/** Validate CSS complexity — returns valid only when most rules use simple selectors */
function validateCssComplexity(html: string): { valid: boolean; reason?: string } {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  let totalRules = 0;
  let complexRules = 0;
  const complexExamples: string[] = [];

  while ((match = styleRegex.exec(html)) !== null) {
    const css = match[1];
    const ruleRegex = /([^{]+)\{([^}]+)\}/g;
    let rule: RegExpExecArray | null;
    while ((rule = ruleRegex.exec(css)) !== null) {
      totalRules++;
      const selector = rule[1].trim();
      // Simple selector: only alphanumeric, ., _, -  — no spaces, :, #, *, commas, []
      if (!/^[a-zA-Z0-9._-]+$/.test(selector)) {
        complexRules++;
        if (complexExamples.length < 3) complexExamples.push(selector);
      }
    }
  }

  if (totalRules === 0) return { valid: false, reason: '没有找到 CSS 规则' };

  // Allow up to 20% complex rules (minor noise is OK)
  if (complexRules > totalRules * 0.2) {
    return { valid: false, reason: `复杂选择器比例过高 (${complexRules}/${totalRules}), 例如: ${complexExamples.join(', ')}` };
  }
  return { valid: true };
}

/** Extract HTML from model response, clean markdown fences */
function extractHtml(fullResponse: string): string | null {
  const htmlMatch = fullResponse.match(/<!-- HTML -->([\s\S]*)<!-- END -->/);
  let html = htmlMatch ? htmlMatch[1].trim() : fullResponse.trim();
  html = html.replace(/^```(?:html)?\s*/gm, '').replace(/```\s*$/gm, '').trim();
  return html && html.length >= 100 ? html : null;
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

          const html = extractHtml(fullResponse);
          if (!html) {
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

async function generatePreview(prd: any, retryCount = 0): Promise<{ html: string; product_name: string }> {
  const messages: any[] = [
    { role: 'system', content: CONTEXT },
    { role: 'user', content: buildPrompt(prd) },
  ];

  // On retry, add a follow-up instruction
  if (retryCount > 0) {
    messages.push({
      role: 'user',
      content: '重要：上次生成的 CSS 包含复杂选择器，无法在微信小程序中渲染。请重新生成，严格遵守 CSS 约束：只使用 .类名 和 标签名 作为选择器，不要空格、不要冒号、不要逗号。每条规则一个选择器。用 <!-- HTML --> 和 <!-- END --> 包裹。',
    });
  }

  let fullResponse = '';
  for await (const token of chatCompletionStream(messages, { temperature: 0.6 + retryCount * 0.1, max_tokens: 8192 })) {
    fullResponse += token;
  }

  const html = extractHtml(fullResponse);
  if (!html) throw new Error('生成的页面异常');

  // Validate CSS complexity — retry up to 1 time for Mini Program
  const validation = validateCssComplexity(html);
  if (!validation.valid && retryCount < 1) {
    return generatePreview(prd, retryCount + 1);
  }

  return { html, product_name: prd.product_name };
}
