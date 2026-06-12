import { NextRequest } from 'next/server';
import { chatCompletion } from '@/lib/deepseek';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prd } = body;

    if (!prd) {
      return Response.json({ error: '缺少 PRD 数据' }, { status: 400 });
    }

    const prompt = `你是一个前端设计师。基于以下 PRD 生成一个产品宣传 HTML，包含"静态预览"和"动画演示"两部分。

PRD：
产品名称：${prd.product_name}
一句话描述：${prd.one_liner}
产品定位：${prd.positioning}
目标用户：${prd.target_users}
功能列表：${JSON.stringify(prd.features || [])}
建议定价：${prd.pricing_suggestion || ''}

要求：
1. 使用 Tailwind CSS CDN (https://cdn.tailwindcss.com)，所有代码在单个 HTML 内
2. 整个页面分上下两部分：

【上半部分 - 静态设计预览】
- 产品 Landing Page 设计稿风格
- 包含：Hero 区（产品名+口号）、功能介绍、目标用户、定价方案、页脚
- 设计精美，像真实的产品官网
- Hero 区有个显眼的"观看演示"按钮，点击后平滑滚动到下半部分

【下半部分 - 动画演示】
- 多幕自动播放的产品演示 walkthrough
- 3-4 幕，每幕自动切换（淡入淡出过渡）
- 展示产品核心卖点和使用场景
- 底部有进度指示器（● ● ● ●）
- 当用户通过"观看演示"按钮滚动到这里时自动开始播放

3. 双击 HTML 即可在浏览器打开使用
4. 中文界面
5. 产品名称为 "${prd.product_name}"

只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有其他文字。`;

    const resp = await chatCompletion([
      {
        role: 'system',
        content: '你是一个前端设计师。只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有任何其他文字。',
      },
      { role: 'user', content: prompt },
    ], { temperature: 0.6, max_tokens: 8192 });

    // Extract HTML between markers, or use the whole response
    const htmlMatch = resp.match(/<!-- HTML -->([\s\S]*)<!-- END -->/);
    const html = htmlMatch ? htmlMatch[1].trim() : resp.trim();

    if (!html || html.length < 100) {
      return Response.json({ error: '生成的页面异常，请稍后重试' }, { status: 500 });
    }

    return Response.json({ success: true, preview: { html, product_name: prd.product_name } });
  } catch (error) {
    console.error('Preview generation error:', error);
    return Response.json({ error: '预览页生成出错了，请稍后重试' }, { status: 500 });
  }
}
