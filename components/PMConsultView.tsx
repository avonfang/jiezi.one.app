'use client';

import { useState, useRef, useEffect } from 'react';
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, report, messages: updatedMessages }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '咨询失败');
      }

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
    <div className="border border-blue-200 rounded-xl bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-blue-600 px-4 py-3 flex items-center gap-2">
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
                  className="block w-full text-left text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors"
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
                  ? 'bg-blue-600 text-white'
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
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          发送
        </button>
      </div>
    </div>
  );
}
