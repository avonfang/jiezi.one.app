import { NextRequest } from 'next/server';
import { chatCompletion } from '@/lib/deepseek';
import { useCredit, initCredits } from '@/lib/credits';
import type { ChatMessage, ValidationReport } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, report, messages } = body as {
      idea: string;
      report: ValidationReport;
      messages: ChatMessage[];
    };

    if (!idea || !report || !messages || !Array.isArray(messages)) {
      return Response.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const clientId = request.headers.get('x-client-id') || '';
    if (!clientId) {
      return Response.json(
        { error: '缺少用户标识' },
        { status: 400 }
      );
    }

    // Credit check
    await initCredits(clientId);
    const deducted = await useCredit(clientId);
    if (!deducted) {
      return Response.json(
        { error: '积分不足，请充值', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }

    const systemPrompt = `你是一名拥有 15 年经验的资深产品经理（PM），正在为一位个人开发者提供产品咨询服务。

关于用户的产品想法和你的分析报告：
---
产品想法：${idea}

你的分析结论：${report.verdict} — ${report.verdict_reason}

市场评分：${report.market_score}/100 | 开发可行性评分：${report.feasibility_score}/100

目标用户：${report.target_users}

差异化空间：${report.differentiation}

定价建议：${report.pricing_suggestion}

获客渠道：${report.acquisition_channels}

成本预算：${report.cost_budget}

技术评估：${report.tech_assessment}

风险提示：${report.risk_warnings?.join('；') || '无'}
---

你的角色要求：
1. 你现在就是这位 PM，正在和开发者一对一交流
2. 每次回答要简短（200 字以内），直击要点，不要客套
3. 要给出具体的、可操作的建议，而不是空泛的鼓励
4. 可以挑战用户的想法，指出他没考虑到的问题
5. 结合你的行业经验给出真实案例或类比
6. 用中文回答，语气专业但不刻板`;

    const reply = await chatCompletion([
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ], { temperature: 0.7 });

    return Response.json({ success: true, reply });
  } catch (error) {
    console.error('PM Consult error:', error);
    return Response.json(
      { error: '咨询出错了，请稍后重试' },
      { status: 500 }
    );
  }
}
