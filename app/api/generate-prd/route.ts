import { NextRequest } from 'next/server';
import { chatCompletion } from '@/lib/deepseek';
import type { PRD } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, report } = body;

    if (!idea || !report) {
      return Response.json(
        { error: '缺少产品想法或验证报告' },
        { status: 400 }
      );
    }

    const prompt = `你是一个资深产品经理。基于以下产品想法和验证报告，生成一份结构化的中文产品需求文档（PRD）。

产品想法：${idea}

验证报告摘要：
- 判断：${report.verdict}
- 理由：${report.verdict_reason}
- 目标用户：${report.target_users}
- 差异化：${report.differentiation}
- 建议定价：${report.pricing_suggestion}

输出 JSON：
{
  "product_name": "产品名称（基于想法起一个合适的中文名）",
  "one_liner": "一句话描述",
  "positioning": "产品定位（目标市场、核心价值）",
  "target_users": "目标用户详细描述",
  "user_story": "核心用户故事（谁 + 要什么 + 为什么）",
  "features": [
    { "name": "功能名称", "description": "功能描述", "priority": "P0 | P1 | P2" }
  ],
  "user_flow": "核心用户流程描述",
  "data_models": [
    { "entity": "数据实体名称", "fields": "主要字段说明" }
  ],
  "tech_stack_suggestion": "技术栈建议",
  "next_steps": "下一步行动建议"
}`;

    const resp = await chatCompletion([
      {
        role: 'system',
        content:
          '你是一个资深产品经理。只输出合法的 JSON，不要包含 markdown 代码块标记或其他文字。',
      },
      { role: 'user', content: prompt },
    ], { temperature: 0.6, max_tokens: 4096 });

    let prd: PRD;
    try {
      prd = JSON.parse(resp);
    } catch {
      return Response.json(
        { error: 'PRD 生成异常，请稍后重试' },
        { status: 500 }
      );
    }

    return Response.json({ success: true, prd });
  } catch (error) {
    console.error('PRD generation error:', error);
    return Response.json(
      { error: 'PRD 生成出错了，请稍后重试' },
      { status: 500 }
    );
  }
}
