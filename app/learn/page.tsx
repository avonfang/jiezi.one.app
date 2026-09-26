'use client';

import { useState } from 'react';

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

type Post = {
  id: string;
  cat: string;
  emoji: string;
  mins: string;
  views: string;
  title: string;
  desc: string;
  paras: string[];
  prompt?: string;
  task: string[];
};

const POSTS: Post[] = [
  {
    id: 'xhs', cat: '上手实操', emoji: '✍️', mins: '5 分钟', views: '1.2 万人看过',
    title: '零基础 3 步，让 AI 写出能发的小红书文案',
    desc: '空口一句 → 能直接用的文案，只要 3 步。第一次体验「给目标、它交成品」。',
    paras: [
      '很多人第一次用 AI 写文案，输入「帮我写个小红书」，结果拿到一堆空洞的官话。问题不在 AI，在于你没给它「目标、对象、风格」这三样信息。',
      '先回答两个问题：卖什么（产品/内容）、给谁看（人群）。信息越具体，AI 写得越准。',
      '第一版通常能用但不够好，直接追加一句修改要求，AI 会按你的反馈重写，两三轮就能改到能发的程度。',
    ],
    prompt: '你是一位小红书爆款文案写手。请为【手工香薰蜡烛】写一篇种草笔记，面向【喜欢治愈感的年轻女生】，语气亲切、带 emoji、结尾给行动引导。',
    task: ['想一个你想推广的东西（一本书、一门课、一个爱好）', '填进上面的模板，写出属于你的提示词', '发给任意 AI 助手，把结果改到「我愿意发出去」为止'],
  },
  {
    id: 'prompt', cat: 'Prompt 技巧', emoji: '🪄', mins: '6 分钟', views: '2.0 万人看过',
    title: 'Prompt 万能公式：角色 + 任务 + 对象 + 风格',
    desc: '让 AI 更听话的万能模板，从此告别「它总答不到点上」。',
    paras: [
      '同样的问题，问得好坏，答案天差地别。这个公式是普通人最快能上手的写法，几乎适用于所有 AI。',
      '公式四件套：角色（让 AI 扮演谁）、任务（具体做什么）、对象（给谁、什么形式）、风格（语气、字数、要不要 emoji）。',
    ],
    prompt: '你是【角色】，请帮我【任务】，面向【对象】，要求【风格】。先给我一版，我再让你改。',
    task: ['找一个你最近真实想问 AI 的问题', '用四件套把它重写一遍', '对比改写前后的答案差距'],
  },
  {
    id: 'image', cat: '上手实操', emoji: '🎨', mins: '4 分钟', views: '8.6 千人看过',
    title: '不会 PS 也能做图：一句话生成封面和海报',
    desc: '不用会 PS，一句话出图。配图、封面、海报的零门槛做法。',
    paras: [
      '做内容最头疼的就是配图。现在只要一句话，AI 就能给你出封面、海报、配图。',
      '出图三要素：主体（画面里有什么）、风格（插画/写实/扁平/3D）、用途（封面/头图/海报，比例不同）。',
    ],
    prompt: '画一张扁平插画风格的小红书封面，主体是一个女生在书桌前学习，色调暖黄+奶油白，留出顶部 1/3 放标题，比例 3:4。',
    task: ['为你的小红书/公众号想一个封面主题', '用三要素写一句出图描述', '用任意 AI 绘图工具生成，看效果'],
  },
  {
    id: 'money', cat: 'AI 副业', emoji: '💰', mins: '8 分钟', views: '3.4 万人看过',
    title: '2026 普通人用 AI 搞钱的 5 个真实方向',
    desc: '从副业到小生意的落地路径，附成本与门槛拆解。',
    paras: [
      'AI 不是风口，是工具。真正能赚钱的，是「会用 AI 解决别人问题」的人。',
      '五个方向：AI 内容代运营、AI 做图接单、AI 短视频口播稿、垂直领域 AI 助手、知识付费教程，门槛从低到高。',
    ],
    task: ['从 5 个方向里挑一个你最有资源的', '用芥子验证：市场机会、难度、竞品怎么样', '先做一个小版本，跑通一个真实客户'],
  },
  {
    id: 'talk', cat: 'AI 入门', emoji: '🧠', mins: '4 分钟', views: '1.5 万人看过',
    title: '怎么和 AI 对话？先别把它当搜索引擎',
    desc: '开窍第一步：改变提问方式，AI 才会给出有用的答案。',
    paras: [
      '很多人把 AI 当百度用：丢个关键词，等它吐结果。这是最大的误区。AI 是能和你来回改的合作者，不是一次性答案机器。',
      '三个心态转变：给上下文、来回改、要它追问。',
    ],
    prompt: '我是第一次做小红书，想请你帮我规划账号。请先问我 5 个关键问题，等我回答完再给方案。',
    task: ['找一个你最近想问的问题', '加上一句「请先问我几个问题，再回答」', '看看答案是不是靠谱多了'],
  },
  {
    id: 'validate', cat: 'AI 副业', emoji: '💡', mins: '6 分钟', views: '9.1 千人看过',
    title: '用一个想法，让 AI 帮你判断值不值得做',
    desc: '芥子玩法：从点子到验证报告，AI 帮你避开伪需求。',
    paras: [
      '90% 的创业想法死在一开始没验证。你可能花三个月做出一个没人要的东西。',
      '验证三步：描述想法、看市场机会、看竞品。在芥子里会自动生成完整的验证报告：市场评分、竞品清单、PRD 和预览页。',
    ],
    prompt: '我想做一个 AI 记账工具，自动分析微信和支付宝账单。请告诉我：市场机会、目标人群、已有竞品、主要风险。',
    task: ['想一个你一直想做、但没验证过的想法', '去芥子首页输入它，跑一份验证报告', '看看结论是「建议尝试」还是「谨慎做」'],
  },
];

export default function LearnPage() {
  const [cat, setCat] = useState('全部');
  const [postId, setPostId] = useState<string | null>(null);
  const post = POSTS.find((p) => p.id === postId) || null;
  const list = cat === '全部' ? POSTS : POSTS.filter((p) => p.cat === cat);

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
          <button onClick={() => setPostId(null)} className="text-sm text-gray-500 hover:text-[#2564F8] mb-6">← 返回教程列表</button>
          <article className="bg-white border border-[#E9E9ED] rounded-2xl p-8 shadow-sm">
            <span className={'inline-block text-xs px-3 py-1 rounded-full font-medium ' + CAT_CLASS[post.cat]}>{post.cat}</span>
            <h1 className="text-2xl font-bold mt-4 leading-snug text-[#14151C]">{post.title}</h1>
            <div className="flex items-center gap-3 mt-3 pb-5 mb-2 border-b border-gray-100 text-xs text-gray-400">
              <span>👀 {post.views}</span><span>·</span><span>⏱ {post.mins}</span>
            </div>
            {post.paras.map((p, i) => (
              <p key={i} className="text-[15px] text-gray-700 leading-relaxed mt-4">{p}</p>
            ))}
            {post.prompt && (
              <div className="mt-5 bg-[#F5F7FF] border border-[#DCE3FF] border-l-4 border-l-[#2564F8] rounded-lg px-4 py-3 text-sm text-gray-800 leading-relaxed">
                {post.prompt}
              </div>
            )}
            <div className="mt-6 bg-gradient-to-br from-[#F0F7FF] to-[#F7F4FF] border border-[#DFE6FF] rounded-xl p-5">
              <h3 className="font-semibold flex items-center gap-2 text-[#14151C]">✋ 陪练任务</h3>
              <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
                {post.task.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
            </div>
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
              {list.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPostId(p.id)}
                  className="text-left bg-white border border-[#E9E9ED] rounded-xl p-5 flex flex-col gap-3 hover:border-[#D6D7DC] transition-colors"
                >
                  <span className={'w-11 h-11 rounded-lg flex items-center justify-center text-xl ' + EMOJI_BG[p.cat]}>{p.emoji}</span>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={'px-2.5 py-0.5 rounded-full font-medium ' + CAT_CLASS[p.cat]}>{p.cat}</span>
                    <span>{p.mins}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold leading-snug text-gray-900">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1">{p.desc}</p>
                  <div className="text-xs text-gray-400 border-t border-gray-100 pt-3">👀 {p.views} · 阅读 →</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
