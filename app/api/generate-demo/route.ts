import { NextRequest } from 'next/server';
import { chatCompletion } from '@/lib/deepseek';

export async function POST(_request: NextRequest) {
  try {
    const prompt = `你是一个前端 + 动效设计师。请为 AI 产品验证工具"芥子"生成一个产品演示 HTML 页面。

芥子的功能：用户输入产品想法 → AI 自动验证方向（搜索竞品+市场分析）→ 生成 PRD → 生成产品预览页。

要求：
1. 这是一个自动播放的产品演示页，不是真实产品
2. 使用 Tailwind CSS CDN (https://cdn.tailwindcss.com)，所有代码在单个 HTML 内
3. 包含 4 幕动画，每幕之间用动画过渡：

第1幕 - 输入想法：展示一个模拟的输入框，用打字动画打出"我想做一个AI记账本，自动识别微信和支付宝账单..."
第2幕 - AI验证：展示模拟的加载动画，然后弹出验证报告卡片（包含市场分析、竞品列表）
第3幕 - PRD生成：展示模拟的PRD文档，有功能列表、优先级标签
第4幕 - 产品预览：展示一个精美的产品 Landing Page 缩略图

4. 每幕之间有明显的视觉过渡（淡入淡出、上滑等），自动轮播
5. 底部有指示器显示当前进度（1/4, 2/4, 3/4, 4/4）
6. 底部有"免费开始使用"按钮链接用户到芥子实际使用
7. 整体设计现代、美观、流畅
8. 中文界面
9. 画面中要体现"芥子"品牌名

只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有其他文字。`;

    const resp = await chatCompletion([
      {
        role: 'system',
        content: '你是一个前端设计师。只输出 HTML 代码，用 <!-- HTML --> 和 <!-- END --> 包裹，不要有任何其他文字。',
      },
      { role: 'user', content: prompt },
    ], { temperature: 0.6, max_tokens: 8192 });

    const htmlMatch = resp.match(/<!-- HTML -->([\s\S]*)<!-- END -->/);
    const html = htmlMatch ? htmlMatch[1].trim() : resp.trim();

    if (!html || html.length < 200) {
      return Response.json({ error: '生成的演示页异常，请稍后重试' }, { status: 500 });
    }

    return Response.json({ success: true, html });
  } catch (error) {
    console.error('Demo generation error:', error);
    return Response.json({ error: '演示页生成出错了，请稍后重试' }, { status: 500 });
  }
}
