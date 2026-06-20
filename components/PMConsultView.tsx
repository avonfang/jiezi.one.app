'use client';

import { useState, useRef, useEffect } from 'react';
import { getAuthHeaders } from '@/lib/client-id';
import type { ChatMessage, ValidationReport } from '@/lib/types';

interface PMConsultViewProps {
  idea: string;
  report: ValidationReport;
}

export default function PMConsultView({ idea, report }: PMConsultViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessage: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/pm-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ idea, report, messages: updatedMessages }),
      });

      if (res.status === 402) {
        window.location.href = '/pricing';
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '咨询失败');
      }

      // Notify sidebar to refresh credit balance
      window.dispatchEvent(new CustomEvent('credits-changed'));

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '抱歉，我遇到了一点问题。请稍后重试。'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className="rounded-xl overflow-hidden liquid-glass">
      {/* Header */}
      <div className="gradient-primary px-4 py-3 flex items-center gap-2">
        <span className="text-lg">👨‍💼</span>
        <div>
          <p className="text-sm font-medium text-white">资深 PM 顾问</p>
          <p className="text-xs text-blue-200">基于你的验证报告，给你针对性的建议</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400 mb-4">
              你可以问我这些问题：
            </p>
            <div className="space-y-2">
              {[
                '这个产品值得我全职做吗？',
                '最大的风险是什么，怎么规避？',
                '如果只有一个核心功能，应该先做什么？',
                '竞争对手比我强在哪，我该怎么打？',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="block w-full text-left text-sm text-blue-600 rounded-lg px-3 py-2 transition-colors" style={{background:'rgba(79,139,255,0.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(79,139,255,0.1)'}}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'gradient-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
              思考中<span className="animate-pulse">...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Credit notice */}
      <div className="px-4 pt-2 pb-0">
        <p className="text-[10px] text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          每次提问消耗 1 积分
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入你的问题..."
          disabled={loading}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="rounded-xl gradient-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all" style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
        >
          发送
        </button>
      </div>
    </div>
  );
}
