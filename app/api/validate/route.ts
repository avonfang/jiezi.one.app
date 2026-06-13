import { NextRequest } from 'next/server';
import { chatCompletion, chatCompletionStream } from '@/lib/deepseek';
import { search } from '@/lib/brave-search';
import { useCredit, initCredits } from '@/lib/credits';
import { saveValidation } from '@/lib/recent-validations';
import type { ValidationReport } from '@/lib/types';

const encoder = new TextEncoder();

function progressEvent(stage: string, message: string) {
  return encoder.encode(JSON.stringify({ type: 'progress', stage, message }) + '\n');
}

function tokenEvent(text: string) {
  return encoder.encode(JSON.stringify({ type: 'token', text }) + '\n');
}

function resultEvent(report: ValidationReport) {
  return encoder.encode(JSON.stringify({ type: 'result', report }) + '\n');
}

function errorEvent(message: string) {
  return encoder.encode(JSON.stringify({ type: 'error', message }) + '\n');
}

export async function POST(request: NextRequest) {
  const clientId = request.headers.get('x-client-id');
  if (!clientId) {
    return Response.json({ error: '缺少客户端标识' }, { status: 400 });
  }

  await initCredits(clientId);
  const deducted = await useCredit(clientId);
  if (!deducted) {
    return Response.json({ error: '积分不足，请充值', code: 'INSUFFICIENT_CREDITS' }, { status: 402 });
  }

  const body = await request.json();
  const idea = body?.idea?.trim();
  if (!idea || typeof idea !== 'string' || idea.length < 4) {
    return Response.json({ error: '请输入至少 4 个字符描述你的产品想法' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Extract structured info
        controller.enqueue(progressEvent('extracting', '正在分析产品信息...'));
        const extractResp = await chatCompletion([
          {
            role: 'system',
            content: '你是一个产品分析助手。只输出合法的 JSON，不要包含 markdown 代码块标记或其他文字。',
          },
          {
            role: 'user',
            content: `从以下产品想法中提取结构化信息：

产品想法：${idea}

输出 JSON：
{
  "target_users": "目标用户描述",
  "core_features": "核心功能描述",
  "industry": "所属行业",
  "keywords": ["搜索关键词1", "搜索关键词2", "搜索关键词3"]
}`,
          },
        ], { temperature: 0.3 });

        let extracted: { target_users: string; core_features: string; industry: string; keywords: string[] };
        try {
          extracted = JSON.parse(extractResp);
        } catch {
          extracted = { target_users: '', core_features: '', industry: '', keywords: [idea.substring(0, 20)] };
        }

        controller.enqueue(progressEvent('extracting', extracted.target_users ? `目标用户：${extracted.target_users.substring(0, 30)}` : ''));

        // Step 2: Search for competitors
        const searchResults: { name: string; snippet: string; url: string }[] = [];
        const keywords = (extracted.keywords || []).slice(0, 3);
        for (let i = 0; i < keywords.length; i++) {
          controller.enqueue(progressEvent('searching', `搜索第 ${i + 1}/${keywords.length} 组关键词`));
          try {
            const results = await search(keywords[i], 5);
            searchResults.push(...results);
            controller.enqueue(progressEvent('searching', `发现 ${searchResults.length} 个相关结果`));
          } catch {
            // continue if one keyword fails
          }
        }

        const searchText = searchResults.length > 0
          ? searchResults.slice(0, 15).map(r => `- ${r.name}：${r.snippet}（来源：${r.url}）`).join('\n')
          : '未找到直接竞品（基于自身知识分析）';

        // Step 3: Analyze search data
        controller.enqueue(progressEvent('analyzing', `搜索到 ${searchResults.length} 个竞品，正在分析数据`));

        // Step 4: Generate validation report (streaming)
        controller.enqueue(progressEvent('generating', 'AI 正在撰写报告...'));
        let reportText = '';
        for await (const token of chatCompletionStream([
          {
            role: 'system',
            content: '你是一个专业的产品市场分析师。只输出合法的 JSON，不要包含 markdown 代码块标记或其他文字。用数值评分时 0-10 分，支持1位小数。',
          },
          {
            role: 'user',
            content: `请分析以下产品方向的可行性，生成验证报告。

产品想法：${idea}
目标用户：${extracted.target_users || '待确定'}
核心功能：${extracted.core_features || '待确定'}
所属行业：${extracted.industry || '待确定'}

搜索结果（同类产品，含来源URL）：
${searchText}

要求：
- market_score 给这个产品方向的市场前景打分（0-100）
- feasibility_score 给你的开发可行性打分（0-100）
- 竞品的 source_url 填写搜索来源中的真实URL
- swot 每个维度至少2条
- 所有评分和判断需基于搜索结果的真实信息，不要编造

输出 JSON：
{
  "verdict": "建议尝试" | "值得探索" | "暂不建议",
  "verdict_reason": "判断理由（2-3句话）",
  "market_score": 数值0-10,
  "feasibility_score": 数值0-10,
  "market_analysis": {
    "competitor_count": "竞品数量评估",
    "demand": "市场需求强度",
    "competition_level": "竞争程度"
  },
  "competitors": [
    {
      "name": "竞品名称",
      "positioning": "产品定位",
      "user_feedback": "用户评价摘要",
      "source_url": "搜索来源URL"
    }
  ],
  "swot": {
    "strengths": ["优势1", "优势2"],
    "weaknesses": ["劣势1", "劣势2"],
    "opportunities": ["机会1", "机会2"],
    "threats": ["威胁1", "威胁2"]
  },
  "differentiation": "差异化空间分析",
  "target_users": "建议优先关注的目标用户",
  "pricing_suggestion": "建议定价区间和模式",
  "acquisition_channels": "获客渠道建议（去哪里找第一批用户）",
  "cost_budget": "开发成本估算（人力、时间、服务器、API等）",
  "risk_warnings": ["风险1", "风险2", "风险3"],
  "revenue_estimation": "收入预估分析（市场规模、潜在用户数、月收入预估范围、多久能回本）",
  "tech_assessment": "技术实现评估（需要的技术栈、最难的模块、有没有现成的开源方案可参考）",
  "mvp_timeline": "MVP 落地时间线建议（分几个阶段、每个阶段做什么、大概需要多久）"
}`,
          },
        ], { temperature: 0.5 })) {
          reportText += token;
          controller.enqueue(tokenEvent(token));
        }

        let report: ValidationReport;
        try {
          report = JSON.parse(reportText);
        } catch {
          controller.enqueue(errorEvent('AI 分析结果异常，请稍后重试'));
          controller.close();
          return;
        }

        report.has_search_data = searchResults.length > 0;

        // Save to recent validations (fire-and-forget)
        saveValidation(idea, report).catch(() => {});

        controller.enqueue(progressEvent('done', '分析完成'));
        controller.enqueue(resultEvent(report));
        controller.close();
      } catch (error) {
        console.error('Validation error:', error);
        try {
          controller.enqueue(errorEvent('验证过程出错了，请稍后重试'));
        } catch { /* ignore if stream already closed */ }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson' },
  });
}
