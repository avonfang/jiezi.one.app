'use client';

import { useState } from 'react';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (content.trim().length < 2) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contact }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => { setOpen(false); setDone(false); setContent(''); setContact(''); }, 2000);
    } catch {
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-white border border-gray-200 rounded-full shadow-lg px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-all"
      >
        反馈
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">反馈建议</h3>
              <button onClick={() => { setOpen(false); setError(''); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
            </div>

            {done ? (
              <p className="text-green-600 text-sm text-center py-6">感谢你的反馈！</p>
            ) : (
              <>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="有什么想法、建议或遇到的问题？"
                  rows={4}
                  className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <input
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="联系方式（选填，方便我回复你）"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 mt-2"
                />
                {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                <button
                  onClick={handleSubmit}
                  disabled={content.trim().length < 2 || submitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mt-3"
                >
                  {submitting ? '提交中...' : '提交反馈'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
