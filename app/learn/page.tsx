'use client';

import { useEffect, useState } from 'react';
import type { Tutorial } from '@/lib/tutorial-types';

const CATS = ['全部', 'AI 入门', '上手实操', 'Prompt 技巧', 'AI 副业'];
const CAT_CLASS: Record<string, string> = {
  'AI 入门': 'bg-blue-50 text-blue-600',
  '上手实操': 'bg-teal-50 text-teal-600',
  'Prompt 技巧': 'bg-violet-50 text-violet-600',
  'AI 副业': 'bg-orange-50 text-orange-600',
};
const EMOJI_BG: Record<string, string> = {
  'AI 入门': 'bg-blue-50',
  '上手实操': 'bg-teal-50',
  'Prompt 技巧': 'bg-violet-50',
  'AI 副业': 'bg-orange-50',
};


export default function LearnPage() {
  const [cat, setCat] = useState('全部');
  const [postId, setPostId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    const syncPost = () => setPostId(new URLSearchParams(window.location.search).get('post'));
    syncPost();
    window.addEventListener('popstate', syncPost);
    fetch('/api/tutorials', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('load'); return r.json(); })
      .then(data => setPosts(data.tutorials || []))
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    return () => window.removeEventListener('popstate', syncPost);
  }, []);
  const post = posts.find((p) => p.id === postId) || null;
  const list = cat === '全部' ? posts : posts.filter((p) => p.cat === cat);

  return (
    <main className="min-h-screen bg-[#F2F2F4]">
      <header className="h-16 bg-[#FAFAFC] border-b border-[#E9E9ED] sticky top-0 z-50 flex items-center">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between w-full">
          <a href="/" className="flex items-center gap-2 font-semibold text-[#14151C]">
            <span className="w-7 h-7 rounded-md bg-gradient-to-br from-[#2564F8] to-[#615CED] text-white flex items-center justify-center text-sm font-bold">芥</span>
            芥子
          </a>
          <div className="flex items-center gap-5">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-900">首页</a>
            <a href="/zhixian" className="text-sm text-gray-500 hover:text-gray-900">仙人指路</a>
            <a href="/app" className="text-sm text-gray-500 hover:text-gray-900">想法验证</a>
          </div>
        </div>
      </header>

      {post ? (
        <div className="max-w-2xl mx-auto px-4 py-10">
          <button onClick={() => { setPostId(null); window.history.replaceState(null, '', '/learn'); }} className="text-sm text-gray-500 hover:text-[#2564F8] mb-6">← 返回教程列表</button>
          <article className="bg-white border border-[#E9E9ED] rounded-2xl p-8 shadow-sm">
            <span className={'inline-block text-xs px-3 py-1 rounded-full font-medium ' + CAT_CLASS[post.cat]}>{post.cat}</span>
            <h1 className="text-2xl font-bold mt-4 leading-snug text-[#14151C]">{post.title}</h1>
            <div className="flex items-center gap-3 mt-3 pb-5 mb-2 border-b border-gray-100 text-xs text-gray-400">
              <span>⏱ {post.mins}</span>
            </div>
            {post.paras.map((p, i) => (
              <p key={i} className="text-[15px] text-gray-700 leading-relaxed mt-4">{p}</p>
            ))}
            {post.prompt && (
              <div className="mt-5 bg-[#F5F7FF] border border-[#DCE3FF] border-l-4 border-l-[#2564F8] rounded-lg px-4 py-3 text-sm text-gray-800 leading-relaxed">
                {post.prompt}
              </div>
            )}
            {post.task.length > 0 && <div className="mt-6 bg-gradient-to-br from-[#F0F7FF] to-[#F7F4FF] border border-[#DFE6FF] rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 text-[#14151C]">✋ 陪练任务</h3>
              <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
                {post.task.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>}
          </article>
          <div className="mt-6 bg-white border border-[#E9E9ED] rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div>
              <div className="text-sm font-semibold text-[#14151C]">学完这篇，去把你的想法变成现实</div>
              <div className="text-xs text-gray-400 mt-1">用芥子验证市场方向、生成 PRD 和产品预览页</div>
            </div>
            <a href="/" className="bg-[#06111A] text-white text-sm rounded-full px-5 py-2.5 whitespace-nowrap">去验证想法 →</a>
          </div>
        </div>
      ) : (
        <div>
          <section className="text-center py-14 px-4 bg-gradient-to-r from-[#2564F8] via-[#615CED] to-[#FA8125] text-white">
            <div className="text-xs opacity-85 mb-3">芥子 · 学 AI</div>
            <h1 className="text-3xl font-bold leading-tight">从「只会聊天」到「用 AI 做成事」</h1>
            <p className="text-sm opacity-90 mt-3">边学边练，学完立刻能用。每篇 = 一篇文章 + 一个陪练任务 + 一个出口。</p>
          </section>

          <div className="max-w-3xl mx-auto px-4 -mt-6">
            <div className="bg-white border border-[#E9E9ED] rounded-2xl p-5 flex flex-wrap items-center gap-2 shadow-sm">
              <span className="text-sm font-medium text-[#3DA10F] bg-[rgba(82,196,26,0.08)] rounded-full px-3 py-1.5">✓ 开窍</span>
              <span className="text-gray-300">→</span>
              <span className="text-sm font-medium text-[#2564F8] bg-[#F0F7FF] rounded-full px-3 py-1.5">2 上手 · 进行中</span>
              <span className="text-gray-300">→</span>
              <span className="text-sm text-gray-400 bg-gray-50 rounded-full px-3 py-1.5">🔒 会指挥</span>
              <span className="text-gray-300">→</span>
              <span className="text-sm text-gray-400 bg-gray-50 rounded-full px-3 py-1.5">🔒 搞钱</span>
            </div>

            <div className="flex gap-2 mt-6 flex-wrap">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={'text-sm rounded-full px-4 py-2 border transition-colors ' + (cat === c ? 'bg-[#2564F8] border-[#2564F8] text-white font-medium' : 'bg-white border-[#E9E9ED] text-gray-600 hover:border-[#D6D7DC]')}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pb-16">
              {loading && <p className="text-sm text-gray-500">教程加载中...</p>}
              {loadError && <p className="text-sm text-red-500">教程加载失败，请刷新页面重试</p>}
              {!loading && !loadError && list.length === 0 && <p className="text-sm text-gray-500">暂无已发布教程</p>}
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setPostId(p.id); window.history.replaceState(null, '', '/learn?post=' + encodeURIComponent(p.id)); }}
                  className="text-left bg-white border border-[#E9E9ED] rounded-xl p-5 flex flex-col gap-3 hover:border-[#D6D7DC] transition-colors"
                >
                  <span className={'w-11 h-11 rounded-lg flex items-center justify-center text-xl ' + EMOJI_BG[p.cat]}>{p.emoji}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={'px-2.5 py-0.5 rounded-full font-medium ' + CAT_CLASS[p.cat]}>{p.cat}</span>
                    <span>{p.mins}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{p.desc}</p>
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">阅读 →</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
