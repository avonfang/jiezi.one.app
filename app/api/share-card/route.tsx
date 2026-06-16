import { NextRequest } from 'next/server';
import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

const VERDICT_STYLES: Record<string, { bg: string; text: string }> = {
  '建议尝试': { bg: '#34C472', text: '#FFFFFF' },
  '推荐做': { bg: '#34C472', text: '#FFFFFF' },
  '值得探索': { bg: '#F59E6B', text: '#FFFFFF' },
  '谨慎做': { bg: '#F59E6B', text: '#FFFFFF' },
  '暂不建议': { bg: '#EF4444', text: '#FFFFFF' },
  '不建议做': { bg: '#EF4444', text: '#FFFFFF' },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idea = searchParams.get('idea');
  const verdict = searchParams.get('verdict') || '值得探索';
  const market_score = parseInt(searchParams.get('market_score') || '0');
  const feasibility_score = parseInt(searchParams.get('feasibility_score') || '0');
  const one_liner = searchParams.get('one_liner');

  if (!idea) {
    return new Response('请通过 POST 请求生成分享卡片，或在 URL 中添加参数', {
      status: 400,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return generateCard({ idea, verdict, market_score, feasibility_score, summary: one_liner ? { one_liner } : undefined });
}

export async function POST(request: NextRequest) {
  try {
    const { idea, verdict, market_score, feasibility_score, summary } = await request.json();
    if (!idea || !verdict) return Response.json({ error: '缺少参数' }, { status: 400 });
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
  const vs = VERDICT_STYLES[verdict] || { bg: '#8B6FE8', text: '#FFFFFF' };
  const avgScore = Math.round(((market_score || 0) + (feasibility_score || 0)) / 2);
  const oneLiner = summary?.one_liner;

  return new ImageResponse(
    (
      <div style={{
        width: 800,
        height: 1000,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#5B6FE6',
        fontFamily: 'sans-serif',
        padding: 60,
      }}>
        {/* Brand row */}
        <div style={{ display: 'flex', marginBottom: 60 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF' }}>芥子</span>
        </div>

        {/* Verdict badge */}
        <div style={{
          display: 'flex',
          paddingTop: 12,
          paddingBottom: 12,
          paddingLeft: 28,
          paddingRight: 28,
          borderRadius: 999,
          backgroundColor: vs.bg,
          color: vs.text,
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 40,
        }}>
          {verdict}
        </div>

        {/* Idea */}
        <div style={{
          fontSize: 42,
          color: '#FFFFFF',
          fontWeight: 700,
          lineHeight: 1.4,
          marginBottom: oneLiner ? 32 : 0,
        }}>
          {idea}
        </div>

        {/* One-liner */}
        {oneLiner && (
          <div style={{
            display: 'flex',
            marginTop: 48,
            paddingTop: 32,
            paddingBottom: 32,
            paddingLeft: 28,
            paddingRight: 28,
            borderRadius: 16,
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}>
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
              {oneLiner}
            </span>
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 36,
          marginTop: 60,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>JIEZI</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>AI 分析仅供参考</span>
        </div>
      </div>
    ),
    { width: 800, height: 1000 },
  );
}
