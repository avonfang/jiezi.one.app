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
      status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
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
  idea: string; verdict: string; market_score: number; feasibility_score: number;
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
        backgroundColor: '#1A1040',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: -160, left: -80,
          width: 500, height: 500, borderRadius: 250,
          backgroundColor: '#4A00E0', opacity: 0.35,
        }} />
        <div style={{
          position: 'absolute', bottom: -100, right: -60,
          width: 400, height: 400, borderRadius: 200,
          backgroundColor: '#8E2DE2', opacity: 0.25,
        }} />
        <div style={{
          position: 'absolute', top: 300, right: -100,
          width: 300, height: 300, borderRadius: 150,
          backgroundColor: '#6C3CE0', opacity: 0.15,
        }} />
        {/* Top-right warm accent */}
        <div style={{
          position: 'absolute', top: 80, right: 80,
          width: 160, height: 160, borderRadius: 80,
          backgroundColor: '#F59E6B', opacity: 0.06,
        }} />

        {/* Main content */}
        <div style={{
          display: 'flex', flexDirection: 'column', flex: 1,
          padding: 56, position: 'relative',
        }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48,
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: '#8E2DE2',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12,
              }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>J</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>芥子</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>AI 产品验证</span>
              </div>
            </div>
          </div>

          {/* Glass card */}
          <div style={{
            display: 'flex', flexDirection: 'column', flex: 1,
            padding: 48,
            borderRadius: 32,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            {/* Verdict badge */}
            <div style={{
              display: 'flex', paddingTop: 10, paddingBottom: 10, paddingLeft: 22, paddingRight: 22,
              borderRadius: 999, backgroundColor: vs.bg, color: vs.text,
              fontSize: 20, fontWeight: 700, marginBottom: 28,
            }}>
              {verdict}
            </div>

            {/* Idea + Score */}
            <div style={{ display: 'flex', marginBottom: 20 }}>
              <div style={{ flex: 1, marginRight: 32 }}>
                <div style={{ fontSize: 36, color: '#FFFFFF', fontWeight: 800, lineHeight: 1.35, marginBottom: 12 }}>
                  {idea}
                </div>
                {oneLiner && (
                  <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                    {oneLiner}
                  </div>
                )}
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                width: 120, height: 120, borderRadius: 60,
                border: '3px solid rgba(255,255,255,0.12)',
                backgroundColor: 'rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: '#FFFFFF' }}>{avgScore}</span>
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>/10</span>
              </div>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Score pills */}
            <div style={{ display: 'flex' }}>
              <ScorePill label="市场前景" score={market_score} />
              <div style={{ width: 16 }} />
              <ScorePill label="开发可行性" score={feasibility_score} />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 32,
          }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              用小想法，创造大未来
            </span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              JIEZI.ONE
            </span>
          </div>
        </div>
      </div>
    ),
    { width: 800, height: 1000 },
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? '#34C472' : score >= 5 ? '#F59E6B' : '#EF4444';
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      paddingTop: 20, paddingBottom: 20, paddingLeft: 24, paddingRight: 24,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginLeft: 2 }}>/10</span>
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <div key={i} style={{
            width: 12, height: 4, borderRadius: 2, marginRight: 4,
            backgroundColor: i <= score ? color : 'rgba(255,255,255,0.08)',
          }} />
        ))}
      </div>
    </div>
  );
}
