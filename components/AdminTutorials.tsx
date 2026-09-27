'use client';

import { useCallback, useEffect, useState } from 'react';
import { TUTORIAL_CATEGORIES, type Tutorial } from '@/lib/tutorial-types';

type Form = Omit<Tutorial, 'paras' | 'task'> & { paras: string; task: string; prompt: string };
const blank = (): Form => ({
  id: '', cat: 'AI 入门', emoji: '📖', mins: '5 分钟', title: '', desc: '',
  paras: '', prompt: '', task: '', published: false,
});
const toForm = (t: Tutorial): Form => ({
  ...t, paras: t.paras.join('\n\n'), task: t.task.join('\n'), prompt: t.prompt || '',
});

export default function AdminTutorials({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [form, setForm] = useState<Form>(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/tutorials');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '加载失败');
      setTutorials(data.tutorials || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => { void load(); }, [load]);

  const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm(old => ({ ...old, [key]: value }));

  const save = async (published: boolean) => {
    setMessage('');
    if (!form.title.trim() || !form.desc.trim() || !form.paras.trim()) {
      setMessage('请填写标题、简介和正文');
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/tutorials', {
        method: 'POST',
        body: JSON.stringify({ tutorial: {
          ...form,
          published,
          paras: form.paras.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean),
          task: form.task.split('\n').map(t => t.trim()).filter(Boolean),
        } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '保存失败');
      setForm(toForm(data.tutorial));
      setMessage(published ? '已发布，公开页面现在可见' : '草稿已保存，公开页面不会显示');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const input = 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400';

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      <aside className="rounded-xl bg-white/60 border border-white p-4 h-fit">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">AI 教程</h2>
          <button onClick={() => { setForm(blank()); setMessage(''); }} className="text-sm text-blue-600">+ 新建</button>
        </div>
        {loading ? <p className="text-sm text-gray-400">加载中...</p> : tutorials.map(t => (
          <button key={t.id} onClick={() => { setForm(toForm(t)); setMessage(''); }} className={'w-full text-left rounded-lg p-2 mb-1 text-sm ' + (form.id === t.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-white/70 text-gray-700')}>
            <span className="block truncate">{t.emoji} {t.title}</span>
            <span className={'text-xs ' + (t.published ? 'text-green-600' : 'text-gray-400')}>{t.published ? '已发布' : '草稿'}</span>
          </button>
        ))}
      </aside>

      <section className="rounded-xl bg-white/70 border border-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900">{form.id ? '编辑教程' : '写新教程'}</h2>
          {form.id && form.published && <a className="text-xs text-blue-600" target="_blank" rel="noreferrer" href={'/learn?post=' + encodeURIComponent(form.id)}>查看公开页 ↗</a>}
        </div>
        <label className="block text-sm text-gray-700">标题 <input className={input + ' mt-1'} maxLength={120} value={form.title} onChange={e => update('title', e.target.value)} placeholder="例如：AI 入门第一课" /></label>
        <label className="block text-sm text-gray-700">简介 <textarea className={input + ' mt-1'} rows={2} maxLength={300} value={form.desc} onChange={e => update('desc', e.target.value)} placeholder="列表卡片上显示的一两句话" /></label>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm text-gray-700">分类 <select className={input + ' mt-1'} value={form.cat} onChange={e => update('cat', e.target.value)}>{TUTORIAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="text-sm text-gray-700">图标 <input className={input + ' mt-1'} maxLength={12} value={form.emoji} onChange={e => update('emoji', e.target.value)} placeholder="📖" /></label>
          <label className="text-sm text-gray-700">阅读时间 <input className={input + ' mt-1'} maxLength={20} value={form.mins} onChange={e => update('mins', e.target.value)} placeholder="5 分钟" /></label>
        </div>
        <label className="block text-sm text-gray-700">正文 <span className="text-xs text-gray-400">（空一行分段）</span><textarea className={input + ' mt-1 min-h-52'} value={form.paras} onChange={e => update('paras', e.target.value)} placeholder="在这里直接写教程正文。\n\n空一行开始新段落。" /></label>
        <label className="block text-sm text-gray-700">示例提示词 <span className="text-xs text-gray-400">（选填）</span><textarea className={input + ' mt-1'} rows={4} value={form.prompt} onChange={e => update('prompt', e.target.value)} placeholder="读者可以直接复制使用的 Prompt" /></label>
        <label className="block text-sm text-gray-700">陪练任务 <span className="text-xs text-gray-400">（每行一项，选填）</span><textarea className={input + ' mt-1'} rows={4} value={form.task} onChange={e => update('task', e.target.value)} placeholder="完成一个小练习" /></label>
        {message && <p role="status" className="text-sm text-blue-700">{message}</p>}
        <div className="flex flex-wrap gap-2">
          <button disabled={saving} onClick={() => void save(false)} className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 disabled:opacity-50">保存为草稿{form.published ? ' / 下架' : ''}</button>
          <button disabled={saving} onClick={() => void save(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50">{saving ? '保存中...' : form.published ? '更新已发布内容' : '发布教程'}</button>
        </div>
        <p className="text-xs text-gray-400">发布或更新后，首页和教程页会自动展示，无需重新部署。</p>
      </section>
    </div>
  );
}
