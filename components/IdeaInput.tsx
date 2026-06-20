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
          className="w-full resize-none rounded-xl border p-4 pr-12 text-base leading-relaxed text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed transition-all" style={{background:'rgba(255,255,255,0.35)', backdropFilter:'blur(12px)', borderColor:'rgba(255,255,255,0.5)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.5)'}} onFocus={e => {e.target.style.borderColor='rgba(79,139,255,0.3)'; e.target.style.boxShadow='inset 0 1px 0 rgba(255,255,255,0.5), 0 0 0 3px rgba(79,139,255,0.08)'}} onBlur={e => {e.target.style.borderColor='rgba(255,255,255,0.5)'; e.target.style.boxShadow='inset 0 1px 0 rgba(255,255,255,0.5)'}}
          disabled={disabled}
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-400 font-mono">
          {text.length}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {text.trim().length < 4
            ? `至少输入 4 个字符（当前 ${text.trim().length}）`
            : '按 ⌘+Enter 提交'}
        </p>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-xl px-6 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed transition-all active:scale-[0.98] gradient-primary"
        >
          验证方向
        </button>
      </div>
    </div>
  );
}
