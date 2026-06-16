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
        position: 'relative',
        backgroundColor: '#5B6FE6',
        fontFamily: 'sans-serif',
      }}>
        {/* ── Decorative gradient overlay (top-right warm glow) ── */}
        <div style={{
          position: 'absolute',
          top: -120,
          right: -120,
          width: 480,
          height: 480,
          borderRadius: 240,
          background: 'rgba(245,158,107,0.15)',
        }} />
        {/* Decorative circle bottom-left */}
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: 160,
          background: 'rgba(139,111,232,0.25)',
        }} />
        {/* Subtle top-left accent */}
        <div style={{
          position: 'absolute',
          top: 60,
          left: 60,
          width: 80,
          height: 80,
          borderRadius: 40,
          background: 'rgba(255,255,255,0.04)',
        }} />

        {/* ── Content (z-index above decorations) ── */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: 60,
          position: 'relative',
        }}>
          {/* ── Brand + Score row ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 48,
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#FFFFFF', letterSpacing: 2 }}>
                芥子
              </span>
              <span style={{
                marginLeft: 10,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#F59E6B',
              }} />
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 52, fontWeight: 800, color: '#FFFFFF' }}>{avgScore}</span>
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>/10</span>
            </div>
          </div>

          {/* ── Verdict badge ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: 10,
            paddingBottom: 10,
            paddingLeft: 24,
            paddingRight: 24,
            borderRadius: 999,
            backgroundColor: vs.bg,
            color: vs.text,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 1,
            marginBottom: 32,
          }}>
            {verdict}
          </div>

          {/* ── Idea ── */}
          <div style={{
            fontSize: 40,
            color: '#FFFFFF',
            fontWeight: 700,
            lineHeight: 1.35,
            marginBottom: oneLiner ? 24 : 0,
          }}>
            {idea}
          </div>

          {/* ── One-liner ── */}
          {oneLiner && (
            <div style={{
              display: 'flex',
              marginTop: 40,
              paddingTop: 32,
              paddingBottom: 32,
              paddingLeft: 28,
              paddingRight: 28,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}>
              <div style={{
                width: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.3)',
                marginRight: 20,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 22,
                color: 'rgba(255,255,255,0.8)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                {oneLiner}
              </span>
            </div>
          )}

          {/* ── Spacer ── */}
          <div style={{ flex: 1 }} />

          {/* ── Score bars ── */}
          <div style={{
            display: 'flex',
            marginBottom: 40,
          }}>
            <ScoreMini label="市场前景" score={market_score} />
            <div style={{ width: 24 }} />
            <ScoreMini label="开发可行性" score={feasibility_score} />
          </div>

          {/* ── Footer ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: 1 }}>
                JIEZI
              </span>
              <span style={{
                marginLeft: 8,
                marginRight: 8,
                width: 4,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.2)',
              }} />
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>
                AI 产品验证
              </span>
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>
              AI 分析仅供参考
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 800, height: 1000 },
  );
}

function ScoreMini({ label, score }: { label: string; score: number }) {
  const pct = Math.round((score || 0) * 10);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 8,
      }}>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{score || 0}</span>
      </div>
      <div style={{
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.12)',
      }}>
        <div style={{
          width: `${pct}%`,
          height: 4,
          borderRadius: 2,
          backgroundColor: score >= 7 ? 'rgba(52,196,114,0.8)' : score >= 5 ? 'rgba(245,158,107,0.8)' : 'rgba(239,68,68,0.8)',
        }} />
      </div>
    </div>
  );
}
