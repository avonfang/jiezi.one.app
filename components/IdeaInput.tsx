'use client';

import { useState, useRef, useEffect } from 'react';

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
  disabled: boolean;
  sampleIdea?: string;
}

export default function IdeaInput({ onSubmit, disabled, sampleIdea }: IdeaInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (sampleIdea) {
      setText(sampleIdea);
    }
  }, [sampleIdea]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (trimmed.length >= 4 && !disabled) {
      onSubmit(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const canSubmit = text.trim().length >= 4 && !disabled;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="描述你的产品想法，例如：&#10;我想做一个 AI 记账本，自动识别微信和支付宝账单，帮我分析每月消费结构"
          rows={5}
          className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 pr-12 text-base leading-relaxed placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          disabled={disabled}
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-400">
          {text.length}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {text.trim().length < 4
            ? `至少输入 4 个字符（当前 ${text.trim().length}）`
            : '按 ⌘+Enter 提交'}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          验证方向
        </button>
      </div>
    </div>
  );
}
