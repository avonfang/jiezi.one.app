import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const VERDICT_COLORS: Record<string, { bg: string; text: string }> = {
  '建议尝试': { bg: '#34C472', text: '#FFFFFF' },
  '推荐做': { bg: '#34C472', text: '#FFFFFF' },
  '值得探索': { bg: '#F59E6B', text: '#FFFFFF' },
  '谨慎做': { bg: '#F59E6B', text: '#FFFFFF' },
  '暂不建议': { bg: '#EF4444', text: '#FFFFFF' },
  '不建议做': { bg: '#EF4444', text: '#FFFFFF' },
};

export async function GET(request: NextRequest) {
  // Support GET with query params for direct browser access / sharing links
  const { searchParams } = new URL(request.url);
  const idea = searchParams.get('idea');
  const verdict = searchParams.get('verdict') || '值得探索';
  const market_score = parseInt(searchParams.get('market_score') || '0');
  const feasibility_score = parseInt(searchParams.get('feasibility_score') || '0');
  const one_liner = searchParams.get('one_liner');

  if (!idea) {
    return new Response('请通过 POST 请求生成分享卡片，或在 URL 中添加 ?idea=xxx&verdict=xxx 参数', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return generateCard({ idea, verdict, market_score, feasibility_score, summary: one_liner ? { one_liner } : undefined });
}

export async function POST(request: NextRequest) {
  try {
    const { idea, verdict, market_score, feasibility_score, summary } = await request.json();

    if (!idea || !verdict) {
      return Response.json({ error: '缺少参数' }, { status: 400 });
    }

    return generateCard({ idea, verdict, market_score, feasibility_score, summary });
  } catch (error) {
    console.error('OG card error:', error);
    return Response.json({ error: '生成失败' }, { status: 500 });
  }
}

function generateCard({ idea, verdict, market_score, feasibility_score, summary }: {
  idea: string;
  verdict: string;
  market_score: number;
  feasibility_score: number;
  summary?: { one_liner?: string };
}) {
  const vc = VERDICT_COLORS[verdict] || { bg: '#8B6FE8', text: '#FFFFFF' };
  const avgScore = Math.round(((market_score || 0) + (feasibility_score || 0)) / 2);
  const oneLiner = summary?.one_liner;

  return new ImageResponse(
    (
      <div
        style={{
          width: 800,
          height: 1000,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#5B6FE6',
          padding: 60,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', marginBottom: 40 }}>
          <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
            芥子 · AI 产品验证
          </span>
        </div>

        {/* Score */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 120,
          height: 120,
          borderRadius: 60,
          border: '6px solid rgba(255,255,255,0.25)',
          marginBottom: 32,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 48, fontWeight: 800, color: '#FFFFFF' }}>
              {avgScore}
            </span>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>
              /10
            </span>
          </div>
        </div>

        {/* Verdict badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 28,
          paddingRight: 28,
          paddingTop: 10,
          paddingBottom: 10,
          borderRadius: 999,
          backgroundColor: vc.bg,
          color: vc.text,
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 24,
        }}>
          {verdict}
        </div>

        {/* Idea text */}
        <div style={{
          fontSize: 36,
          color: '#FFFFFF',
          fontWeight: 700,
          lineHeight: 1.35,
          marginBottom: 16,
        }}>
          {idea}
        </div>

        {/* One-liner */}
        {oneLiner && (
          <div style={{
            padding: 16,
            paddingLeft: 20,
            paddingRight: 20,
            borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderLeft: '4px solid rgba(255,255,255,0.3)',
            fontSize: 20,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            marginTop: 80,
          }}>
            {oneLiner}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 80,
          paddingTop: 40,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
            jiezi.one
          </span>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>
            AI 分析仅供参考
          </span>
        </div>
      </div>
    ),
    { width: 800, height: 1000 },
  );
}
