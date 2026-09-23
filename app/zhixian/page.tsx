'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

import { STARS, type Star } from '@/lib/zhixian/stars';

const TAB_LABELS = ['造型', '名场面', '脚本', '发布策略'];
const FACE_MATCH_ENABLED = process.env.NEXT_PUBLIC_ZHIXIAN_FACE_MATCH_ENABLED === 'true';

function Compass({ spinning, size = 180 }: { spinning?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="96" stroke="#CECBF6" strokeWidth="1" />
      <g style={{ transformOrigin: '100px 100px', animation: 'zx-spin 26s linear infinite' }}>
        <circle cx="100" cy="100" r="82" stroke="#534AB7" strokeWidth="2" strokeDasharray="3 7" />
        <circle cx="100" cy="100" r="68" stroke="#BA7517" strokeWidth="1" strokeDasharray="1 5" />
        <g fill="#534AB7" opacity="0.7" fontSize="12" fontWeight="700" textAnchor="middle">
          <text x="100" y="28">金</text>
          <text x="100" y="178">紫</text>
          <text x="30" y="104">指</text>
          <text x="170" y="104">路</text>
        </g>
      </g>
      <circle cx="100" cy="100" r="52" fill="#534AB7" opacity="0.12" className="animate-pulse-glow" />
      <circle cx="100" cy="100" r="46" fill="#fff" stroke="#534AB7" strokeWidth="2" />
      <g style={{ transformOrigin: '100px 100px', animation: `zx-spin ${spinning ? 1.1 : 7}s linear infinite` }}>
        <path d="M100 48 L108 100 L100 152 L92 100 Z" fill="#534AB7" />
        <path d="M100 48 L108 100 L100 100 Z" fill="#BA7517" />
      </g>
      <circle cx="100" cy="100" r="6" fill="#854F0B" />
    </svg>
  );
}

function Ring({ pct }: { pct: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{ width: 112, height: 112, background: `conic-gradient(#534AB7 0% ${pct}%, #CECBF6 ${pct}% 100%)` }}
    >
      <div className="flex flex-col items-center justify-center rounded-full bg-white" style={{ width: 86, height: 86 }}>
        <b className="text-[22px]" style={{ color: '#534AB7' }}>{pct}%</b>
        <span className="text-[11px]" style={{ color: '#8A8798' }}>相似度</span>
      </div>
    </div>
  );
}

function Avatar({ star, size = 48 }: { star: Star; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ width: size, height: size, background: 'linear-gradient(135deg,#534AB7,#BA7517)', fontSize: Math.round(size * 0.42) }}>
      {star.name[0]}
    </div>
  );
}

export default function ZhixianPage() {
  const [stage, setStage] = useState<'home' | 'loading' | 'result' | 'card'>('home');
  const [consentOpen, setConsentOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [top3, setTop3] = useState<Star[]>([]);
  const [top1Index, setTop1Index] = useState(0);
  const [city, setCity] = useState('上海');
  const [unlocked, setUnlocked] = useState<boolean[]>([true, false, false, false]);
  const [currentTab, setCurrentTab] = useState(0);
  const [toast, setToast] = useState('');
  const [photoTouched, setPhotoTouched] = useState(false);
  const [isMockResult, setIsMockResult] = useState(true);
  const [steps, setSteps] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const top1 = top3[top1Index];

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }

  function pickTop3(): Star[] {
    const start = Math.floor(Math.random() * STARS.length);
    const base = [87, 74, 61];
    const list: Star[] = [];
    for (let i = 0; i < 3; i++) {
      const s = STARS[(start + i) % STARS.length];
      list.push({ ...s, pct: base[i] + Math.floor(Math.random() * 4) });
    }
    return list;
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    e.target.value = '';
    if (!f.type.startsWith('image/')) {
      showToast('请选择图片文件');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      showToast('图片不能超过 15MB');
      return;
    }
    setPhotoTouched(true);

    // 默认安全模式：照片只用于触发本次演示，不读取内容、不上传。
    if (!FACE_MATCH_ENABLED) {
      runAnalysis(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      runAnalysis(reader.result as string);
    };
    reader.onerror = () => showToast('读取照片失败');
    reader.readAsDataURL(f);
  }

  async function runAnalysis(image: string | null) {
    setStage('loading');
    setSteps(0);
    const times = [500, 1300, 2300, 3300];
    times.forEach((t, i) => {
      window.setTimeout(() => setSteps(i + 1), t);
    });

    const [apiResult] = await Promise.all([
      matchApi(image),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3500)),
    ]);

    const list = apiResult?.top3?.length ? apiResult.top3 : pickTop3();
    setIsMockResult(!apiResult || apiResult.mock);
    setTop3(list);
    setTop1Index(0);
    setUnlocked([true, false, false, false]);
    setCurrentTab(0);
    setStage('result');
  }

  async function matchApi(image: string | null): Promise<{ top3: Star[]; mock: boolean } | null> {
    if (!image || !FACE_MATCH_ENABLED) return null;
    try {
      const res = await fetch('/api/zhixian/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, consentFaceSearch: true }),
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.top3)) {
        return { top3: data.top3 as Star[], mock: !!data.mock };
      }
    } catch (error) {
      console.error('match api error', error);
    }
    return null;
  }

  function copyName() {
    const txt = `${city}分腾`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(() => showToast(`已复制「${txt}」`), () => showToast('复制失败'));
    } else {
      showToast(`已复制「${txt}」`);
    }
  }

  function unlockAll() {
    setPayOpen(false);
    setUnlocked([true, true, true, true]);
    showToast('已解锁（演示环境不真实扣费）');
  }

  const stepItems = ['提取风格特征', '匹配明星风格档案', '生成相似度报告', '生成仙人指路卡'];

  return (
    <main className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #F6F5FA 0%, #F3F0FB 55%, #F8F4E9 100%)', color: '#2A2740' }}>
      <style>{`
        @keyframes zx-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes zx-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .zx-fade { animation: zx-fade .35s ease; }
      `}</style>

      {/* header */}
      <header className="relative z-10 max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-sm font-semibold" style={{ color: '#3C3489' }}>芥子</Link>
          <span className="text-sm" style={{ color: '#8A8798' }}>/</span>
          <span className="text-sm font-semibold" style={{ color: '#26215C' }}>仙人指路</span>
        </div>
        <Link href="/" className="text-xs rounded-lg px-3 py-1.5" style={{ background: '#EEEDFE', color: '#534AB7', border: '1px solid #CECBF6' }}>
          返回芥子
        </Link>
      </header>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
        {/* HOME */}
        {stage === 'home' && (
          <div className="zx-fade text-center pt-6">
            <div className="inline-block text-[13px] font-bold rounded-full px-3 py-1.5 mb-6" style={{ background: '#FAEEDA', color: '#854F0B', border: '1px solid #F0DFB8' }}>
              🔥 合肥分腾 同款热梗玩法
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight" style={{ color: '#26215C' }}>
              测出你的<br /><span style={{ color: '#534AB7' }}>明星分身</span>
            </h1>
            <p className="text-sm md:text-base mt-4 leading-relaxed mx-auto max-w-md" style={{ color: '#5D5A75' }}>
              选择一张自拍，得到「风格相似度」报告，再领取一份能直接开拍的方向指南。
            </p>
            <div className="my-8 flex justify-center">
              <div className="animate-float"><Compass /></div>
            </div>
            <button
              onClick={() => setConsentOpen(true)}
              className="w-full max-w-sm rounded-2xl text-white font-bold text-base py-4 tracking-wide transition-transform active:translate-y-px"
              style={{ background: 'linear-gradient(135deg, #534AB7, #3C3489)', boxShadow: '0 10px 24px rgba(83,74,183,.35)' }}
            >
              选择自拍，测测你像谁
            </button>
            <p className="text-xs mt-4" style={{ color: '#8A8798' }}>{FACE_MATCH_ENABLED ? '已获单独同意后上传匹配 · 不做人脸身份识别' : '照片仅本机触发，不上传服务器'}</p>

            <div className="mt-10 text-left">
              <h3 className="text-sm font-bold mb-3" style={{ color: '#26215C' }}>明星风格档案</h3>
              <div className="flex flex-wrap gap-2">
                {STARS.map((s) => (
                  <span key={s.name} className="inline-flex items-center gap-2 text-[13px] rounded-full pl-1.5 pr-3 py-1.5 liquid-glass" style={{ color: '#5D5A75' }}>
                    <Avatar star={s} size={26} />
                    <b style={{ color: '#534AB7' }}>{s.name}</b> {s.tag}
                  </span>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: '#8A8798' }}>全程无明星照片，仅文字标签与原创图形</p>
            </div>
          </div>
        )}

        {/* LOADING */}
        {stage === 'loading' && (
          <div className="zx-fade text-center pt-14">
            <div className="flex justify-center"><Compass spinning /></div>
            <h2 className="text-2xl font-bold mt-8" style={{ color: '#26215C' }}>正在分析你的风格</h2>
            <p className="text-sm mt-2" style={{ color: '#8A8798' }}>{FACE_MATCH_ENABLED ? '已获同意后调用云端风格匹配' : '照片不上传 · 不读取照片内容 · 不做身份识别'}</p>
            <ul className="mt-8 text-left max-w-sm mx-auto">
              {stepItems.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-2.5 border transition-all ${steps >= i + 1 ? 'border-[#0F6E56] bg-[#E1F5EE]' : 'border-[#E4E2EC] bg-white'}`}
                  style={{ color: steps >= i + 1 ? '#0F6E56' : '#8A8798' }}
                >
                  <span
                    className="flex items-center justify-center rounded-full text-[12px]"
                    style={{ width: 20, height: 20, border: steps >= i + 1 ? 'none' : '2px solid #E4E2EC', background: steps >= i + 1 ? '#0F6E56' : 'transparent', color: '#fff' }}
                  >
                    ✓
                  </span>
                  <span className="text-sm font-semibold">{s}</span>
                </li>
              ))}
            </ul>
            {photoTouched && <p className="text-xs mt-6" style={{ color: '#8A8798' }}>{FACE_MATCH_ENABLED ? '已读取照片并发起匹配请求' : '已选择照片（本机触发，未读取内容、未上传）'}</p>}
          </div>
        )}

        {/* RESULT */}
        {stage === 'result' && top1 && (
          <div className="zx-fade pt-4">
            <div className="text-center">
              <span className="inline-block text-xs font-bold rounded-full px-3 py-1" style={{ background: '#FAEEDA', color: '#854F0B' }}>你的风格分身</span>
              {isMockResult && <span className="inline-block text-[11px] font-bold rounded-full px-2 py-0.5 ml-2" style={{ background: '#EEEDFE', color: '#534AB7' }}>演示结果</span>}
              <div className="text-4xl font-extrabold mt-3" style={{ color: '#26215C' }}>
                <span style={{ color: '#534AB7' }}>{city}</span>分腾
              </div>
              <div className="flex justify-center gap-2 mt-4">
                <button onClick={copyName} className="text-sm font-semibold rounded-xl px-4 py-2 liquid-glass" style={{ color: '#5D5A75' }}>复制分身名</button>
                <button
                  onClick={() => {
                    const v = window.prompt('输入你的城市（如：合肥）', city);
                    if (v && v.trim()) setCity(v.trim().replace(/市$/, ''));
                  }}
                  className="text-sm font-semibold rounded-xl px-4 py-2 liquid-glass"
                  style={{ color: '#5D5A75' }}
                >
                  自定义城市
                </button>
              </div>
            </div>

            <div className="mt-7 rounded-3xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(160deg,#fff,#EEEDFE)', border: '1px solid #CECBF6' }}>
              <Ring pct={top1.pct} />
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <Avatar star={top1} size={48} />
                  <div className="text-xl font-extrabold" style={{ color: '#26215C' }}>{top1.name}</div>
                </div>
                <span className="inline-block text-xs rounded-full px-2 py-0.5 mt-1.5" style={{ background: '#FAEEDA', color: '#854F0B' }}>{top1.tag}</span>
                <p className="text-[13px] mt-2 leading-relaxed" style={{ color: '#5D5A75' }}>{top1.desc}</p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {top1.dims.map((d) => (
                    <span key={d} className="text-[11px] rounded-lg px-2 py-0.5 bg-white" style={{ color: '#534AB7', border: '1px solid #CECBF6' }}>像在哪：{d}</span>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold mt-6 mb-2.5" style={{ color: '#26215C' }}>其他可能（点击可切换主分身）</h3>
            {top3.map((s, idx) => {
              if (idx === top1Index) return null;
              return (
                <button
                  key={s.name}
                  onClick={() => setTop1Index(idx)}
                  className="w-full flex items-center gap-3 rounded-2xl bg-white border border-[#E4E2EC] px-4 py-3 mb-2 text-left"
                >
                  <span className="text-[13px] font-extrabold w-4" style={{ color: '#8A8798' }}>{idx + 1}</span>
                  <Avatar star={s} size={40} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-bold" style={{ color: '#2A2740' }}>{s.name}</span>
                    <span className="block text-xs" style={{ color: '#8A8798' }}>{s.tag}</span>
                  </span>
                  <span className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#EEEDFE' }}>
                    <i className="block h-full rounded-full" style={{ width: `${s.pct}%`, background: 'linear-gradient(90deg,#534AB7,#3C3489)' }} />
                  </span>
                  <span className="text-[13px] font-extrabold w-9 text-right" style={{ color: '#534AB7' }}>{s.pct}%</span>
                </button>
              );
            })}

            <button
              onClick={() => { setCurrentTab(0); setStage('card'); }}
              className="w-full mt-4 rounded-2xl text-white font-bold text-base py-4 tracking-wide transition-transform active:translate-y-px"
              style={{ background: 'linear-gradient(135deg, #534AB7, #3C3489)', boxShadow: '0 10px 24px rgba(83,74,183,.35)' }}
            >
              生成仙人指路卡 →
            </button>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConsentOpen(true)} className="flex-1 text-sm font-semibold rounded-xl py-3 liquid-glass" style={{ color: '#5D5A75' }}>换一张重测</button>
              <button onClick={() => showToast(`已生成分享卡：「${city}分腾 · ${top1.name} ${top1.pct}%」（演示）`)} className="flex-1 text-sm font-semibold rounded-xl py-3 liquid-glass" style={{ color: '#5D5A75' }}>分享给朋友</button>
            </div>
            <p className="text-[11px] leading-relaxed text-center mt-3" style={{ color: '#8A8798' }}>{isMockResult ? '演示结果随机生成，仅代表风格参考。' : '结果由云端相似度接口生成，仅代表娱乐参考。'}页面不展示明星照片，也不提供换脸 / 深度合成能力。</p>
          </div>
        )}

        {/* CARD */}
        {stage === 'card' && top1 && (
          <div className="zx-fade pt-4">
            <h2 className="text-xl font-extrabold text-center mb-4" style={{ color: '#26215C' }}>你的仙人指路卡</h2>
            <div className="flex gap-1.5 rounded-2xl p-1.5 mb-4" style={{ background: '#EEEDFE' }}>
              {TAB_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setCurrentTab(i)}
                  className={`flex-1 text-[13px] font-semibold rounded-xl py-2.5 whitespace-nowrap transition-all ${currentTab === i ? 'bg-white text-[#534AB7] shadow' : ''}`}
                  style={{ color: currentTab === i ? '#534AB7' : '#8A8798' }}
                >
                  {label}{!unlocked[i] && <span className="text-[10px] ml-0.5">🔒</span>}
                </button>
              ))}
            </div>

            {unlocked[currentTab] ? (
              <div className="rounded-2xl bg-white border border-[#E4E2EC] p-5 mb-3">
                {currentTab === 0 && (
                  <>
                    <h4 className="text-[15px] font-bold mb-3 flex items-center gap-2" style={{ color: '#26215C' }}>造型方向 <span className="text-[10px] font-bold rounded px-1.5 py-0.5" style={{ background: '#FAEEDA', color: '#854F0B' }}>免费</span></h4>
                    <ul className="space-y-1.5">
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>发型/眉形：</b>参照「{top1.tag}」的轮廓感，先别大改，用眉形和发胶做出“像”的第一印象。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>服装色系：</b>选{top1.name}常穿的深色/大地色系，避免高饱和潮牌，突出“家常感”。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>表情管理：</b>核心是“不使劲”——半眯眼、似笑非笑，把{top1.tag}的松弛感演出来。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>道具：</b>一个保温杯 / 一件旧衬衫，比任何滤镜都管用。</li>
                    </ul>
                  </>
                )}
                {currentTab === 1 && (
                  <>
                    <h4 className="text-[15px] font-bold mb-3" style={{ color: '#26215C' }}>名场面翻拍</h4>
                    <ul className="space-y-1.5">
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}>场景① 办公室里，同事在卷，你端着茶杯慢悠悠来一句“<b style={{ color: '#854F0B' }}>多大点事儿啊</b>”。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}>场景② 电梯偶遇前同事，尬聊三秒后用{top1.name}式的假笑收尾。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}>场景③ 深夜加完班，对着镜头苦笑一声，配文“<b style={{ color: '#854F0B' }}>这班，也不是非上不可</b>”。</li>
                    </ul>
                  </>
                )}
                {currentTab === 2 && (
                  <>
                    <h4 className="text-[15px] font-bold mb-3" style={{ color: '#26215C' }}>15 秒短视频脚本</h4>
                    {[
                      `【0-3s】特写：你对着镜子，突然发现自己有“${top1.name}”的神韵，愣住。`,
                      '【3-9s】切换 3 个模仿动作/表情，逐条叠出“像在哪”。',
                      `【9-12s】甩出分身名“${city}分腾”，画面定格。`,
                      '【12-15s】字幕：“你的分身是谁？来测”→ 引导扫码。',
                    ].map((line) => (
                      <div key={line} className="text-[13px] rounded-xl px-3 py-2.5 mb-2" style={{ background: '#EEEDFE', color: '#5D5A75' }}>{line}</div>
                    ))}
                  </>
                )}
                {currentTab === 3 && (
                  <>
                    <h4 className="text-[15px] font-bold mb-3" style={{ color: '#26215C' }}>发布策略</h4>
                    <ul className="space-y-1.5">
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>发布时间：</b>工作日 12:00-13:00 或 20:00-22:00，蹭通勤/睡前流量。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>话题标签：</b>#仙人指路 #{top1.name} #素人模仿 #我的明星分身。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>标题：</b>“都让我模仿{top1.name}，试了一下……”（避免“必火/保证”类承诺）。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>封面：</b>用你最像的一个定格表情，不加美颜滤镜。</li>
                      <li className="text-sm leading-relaxed" style={{ color: '#5D5A75' }}><b style={{ color: '#854F0B' }}>建议：</b>连发 3 条测试，看哪条更容易被推荐，再集中复刻。</li>
                    </ul>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white border border-dashed border-[#CECBF6] px-5 py-10 text-center">
                <div className="text-3xl">🔒</div>
                <p className="text-sm mt-3 mb-4 leading-relaxed" style={{ color: '#5D5A75' }}>
                  「{TAB_LABELS[currentTab]}」是完整指路卡的一部分。<br />解锁后可查看可执行的模仿建议。
                </p>
                <button onClick={() => setPayOpen(true)} className="inline-block rounded-xl text-white font-semibold text-[15px] px-7 py-3" style={{ background: 'linear-gradient(135deg, #534AB7, #3C3489)' }}>
                  解锁完整指路卡
                </button>
              </div>
            )}

            <button onClick={() => setStage('result')} className="w-full text-sm font-semibold rounded-xl py-3 liquid-glass mt-2" style={{ color: '#5D5A75' }}>← 返回结果</button>
          </div>
        )}
      </div>

      {/* 单独同意弹窗 */}
      {consentOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(20,17,40,.55)' }} onClick={() => setConsentOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-4" style={{ color: '#26215C' }}>选择照片前，请确认</h3>
            <ul className="mb-5 space-y-2">
              {(FACE_MATCH_ENABLED ? [
                '本功能用于「风格相似度」娱乐匹配，不做人脸身份识别，不绑定账号或真实身份。',
                '你需明确同意：照片会上传至芥子后端，并调用腾讯云人脸搜索接口完成相似度匹配。',
                '芥子应用侧不保存原图、不落库；云服务商按其隐私政策处理请求数据。',
                '不提供换脸 / 深度合成等生成能力；未成年人不提供本功能。',
              ] : [
                '本功能仅用于「风格相似度」娱乐分析，不用于身份识别；演示结果随机生成。',
                '纯前端演示：照片只留在本机，不上传服务器、不落库、不向第三方提供。',
                '不提供换脸 / 深度合成等生成能力。',
                '未成年人不提供本功能。',
              ]).map((t) => (
                <li key={t} className="text-sm leading-relaxed rounded-xl px-3.5 py-2.5 pl-9 relative" style={{ background: '#F6F5FA', color: '#5D5A75' }}>
                  <span className="absolute left-3.5 top-[18px] w-2 h-2 rounded-full" style={{ background: '#BA7517' }} />
                  {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() => { setConsentOpen(false); fileRef.current?.click(); }}
              className="w-full rounded-2xl text-white font-bold text-base py-3.5"
              style={{ background: 'linear-gradient(135deg, #534AB7, #3C3489)' }}
            >
              {FACE_MATCH_ENABLED ? '我已成年，同意上传并调用云端匹配' : '我已成年，同意并选择照片'}
            </button>
            <button onClick={() => setConsentOpen(false)} className="w-full text-sm font-semibold py-3 mt-1" style={{ color: '#5D5A75' }}>暂不</button>
          </div>
        </div>
      )}

      {/* 解锁弹窗 */}
      {payOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(20,17,40,.55)' }} onClick={() => setPayOpen(false)}>
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: '#26215C' }}>解锁完整指路卡</h3>
            <div className="text-center mb-5">
              <b className="text-3xl" style={{ color: '#534AB7' }}>60 积分</b>
              <span className="block text-[13px] mt-1.5" style={{ color: '#8A8798' }}>名场面 · 脚本 · 发布策略（演示环境不真实扣费）</span>
            </div>
            <button onClick={unlockAll} className="w-full rounded-2xl text-white font-bold text-base py-3.5" style={{ background: 'linear-gradient(135deg, #534AB7, #3C3489)' }}>
              模拟支付并解锁
            </button>
            <button onClick={() => setPayOpen(false)} className="w-full text-sm font-semibold py-3 mt-1" style={{ color: '#5D5A75' }}>暂不</button>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed left-1/2 bottom-20 z-[60] -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm text-white whitespace-nowrap" style={{ background: 'rgba(38,33,92,.95)' }}>
          {toast}
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </main>
  );
}