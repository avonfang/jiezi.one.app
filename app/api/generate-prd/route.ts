import { NextRequest } from 'next/server';
import { chatCompletionStream } from '@/lib/deepseek';
import { initCredits, useCredits } from '@/lib/credits';
import type { PRD } from '@/lib/types';
import { getUserIdFromRequest } from '@/lib/get-user';

const CONTEXT = `你是一个资深产品经理。根据产品想法和验证报告，生成一份结构化的中文 PRD，只输出合法的 JSON，不要包含 markdown 代码块标记或其他文字。

JSON 格式：
{
  "product_name": "产品名称",
  "one_liner": "一句话描述",
  "positioning": "产品定位",
  "target_users": "目标用户",
  "user_story": "核心用户故事",
  "features": [
    { "name": "功能名称", "description": "功能描述", "priority": "P0 | P1 | P2" }
  ],
  "user_flow": "核心用户流程",
  "data_models": [
    { "entity": "实体", "fields": "字段说明" }
  ],
  "tech_stack_suggestion": "技术栈建议",
  "next_steps": "下一步行动"
}`;

function buildPrompt(idea: string, report: any) {
  return `产品想法：${idea}

验证报告摘要：
- 判断：${report.verdict}
- 理由：${report.verdict_reason}
- 目标用户：${report.target_users}
- 差异化：${report.differentiation}
- 建议定价：${report.pricing_suggestion}

要求：
- features 至少 5 个，P0 是核心功能、P1 重要、P2 增强
- data_models 3-4 个核心实体
- positioning 要体现差异化
- tech_stack_suggestion 给出具体技术选型`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, report } = body;

    if (!idea || !report) {
      return Response.json({ error: '缺少产品想法或验证报告' }, { status: 400 });
    }

    // Credit check — PRD costs 2 credits
    const clientId = getUserIdFromRequest(request) || '';
    if (!clientId) {
      return Response.json({ error: '缺少用户标识' }, { status: 400 });
    }
    await initCredits(clientId);
    const deducted = await useCredits(clientId, 2);
    if (!deducted) {
      return Response.json(
        { error: '积分不足，请充值', code: 'INSUFFICIENT_CREDITS' },
        { status: 402 }
      );
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
        };

        try {
          send({ type: 'progress', stage: 'analyzing', message: '分析验证报告' });

          await new Promise(r => setTimeout(r, 300));

          send({ type: 'progress', stage: 'writing', message: '设计功能架构' });

          const streamStart = Date.now();
          const writingMessages = [
            '设计功能架构',
            '规划技术方案',
            '撰写功能说明',
            '优化内容结构',
          ];

          let fullResponse = '';
          let lastHeartbeat = Date.now();
          for await (const token of chatCompletionStream([
            { role: 'system', content: CONTEXT },
            { role: 'user', content: buildPrompt(idea, report) },
          ], { temperature: 0.6, max_tokens: 4096 })) {
            fullResponse += token;
            const now = Date.now();
            if (now - lastHeartbeat > 3000) {
              const idx = Math.min(Math.floor((now - streamStart) / 3000) - 1, writingMessages.length - 1);
              send({ type: 'progress', stage: 'writing', message: writingMessages[idx] || writingMessages[writingMessages.length - 1] });
              lastHeartbeat = now;
            }
          }

          // Parse the full response
          // Clean markdown code blocks if present
          const cleaned = fullResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const prd: PRD = JSON.parse(cleaned);

          send({ type: 'result', prd });
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
    console.error('PRD generation error:', error);
    return Response.json({ error: 'PRD 生成出错了' }, { status: 500 });
  }
}
