'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  {
    emoji: '⚡',
    title: '极速启动引擎',
    subtitle: '代码脚手架',
    description:
      '内置百种主流框架模板（Next.js、Vue、React Native、Express 等），一键生成项目结构，告别重复配置。从灵感到可运行代码，只需一条命令。',
  },
  {
    emoji: '🎛️',
    title: '原子级配置中心',
    subtitle: '深度定制',
    description:
      '不仅是生成，更是掌控。自定义 Prompt 流、模型参数与输出规范，精细调教每一行代码的输出风格与质量标准。',
  },
  {
    emoji: '🚀',
    title: '一键云端上线',
    subtitle: '代码部署',
    description:
      '集成 Serverless 与容器服务，代码写完即发布，无需运维烦恼。自动 HTTPS、CDN 加速、灰度发布，让产品被世界看到。',
  },
  {
    emoji: '🌐',
    title: '灵感协作广场',
    subtitle: '创意社区',
    description:
      '分享你的 Prompt 与作品，复刻大神思路，在交流中进化。从私人创作到团队协作，让每一份灵感都有回响。',
  },
];

export default function XumiPage() {
  const router = useRouter();
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll('.xumi-card');
            cards.forEach((card, i) => {
              (card as HTMLElement).style.animationDelay = `${i * 0.15}s`;
              card.classList.add('animate-in');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardsRef.current) {
      observer.observe(cardsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      {/* Decorative orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-purple-500/20 blur-[100px] animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute top-40 right-20 w-96 h-96 rounded-full bg-indigo-500/20 blur-[120px] animate-[float_10s_ease-in-out_infinite_1s]" />
      <div className="absolute bottom-40 left-1/3 w-80 h-80 rounded-full bg-fuchsia-500/15 blur-[100px] animate-[pulse-glow_6s_ease-in-out_infinite_2s]" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-blue-500/10 blur-[80px] animate-[float_12s_ease-in-out_infinite_0.5s]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-block backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl px-10 py-10 shadow-2xl animate-[fadeIn_0.8s_ease-out]">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              须弥
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-300">
                {' '}
                · 开发者的无限宇宙
              </span>
            </h1>
            <p className="text-lg text-purple-200/80 max-w-xl mx-auto leading-relaxed">
              从代码生成到云端部署，一站式闭环体验。
            </p>
          </div>
        </div>

        {/* Feature cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
        >
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="xumi-card opacity-0 translate-y-6 [&.animate-in]:opacity-100 [&.animate-in]:translate-y-0 transition-all duration-700 ease-out backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-8 hover:bg-white/15 hover:border-purple-400/40 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-xl font-semibold text-white mb-1">{f.title}</h3>
              <p className="text-sm text-purple-300/70 mb-3 font-medium">{f.subtitle}</p>
              <p className="text-sm text-purple-200/60 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 animate-[fadeIn_1s_ease-out_0.8s_both]">
          <button
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold px-10 py-4 rounded-xl text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
          >
            开始探索须弥
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold px-10 py-4 rounded-xl text-lg shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m0 0l7 7m-7-7l7-7" />
            </svg>
            回到芥子
          </button>
        </div>
        <p className="text-purple-300/40 text-sm mt-4 text-center">更多功能正在开发中，敬请期待</p>
      </div>
    </div>
  );
}
