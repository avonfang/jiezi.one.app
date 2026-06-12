'use client';

const STAGE_INFO: Record<string, { label: string; estimate: string }> = {
  extracting: { label: '正在分析产品信息...', estimate: '约 5 秒' },
  searching: { label: '正在搜索竞品...', estimate: '约 5-10 秒' },
  generating: { label: 'AI 正在生成评估报告...', estimate: '约 10-15 秒' },
  done: { label: '分析完成', estimate: '' },
};

export default function LoadingState({ stage, tokens }: { stage?: string; tokens?: string }) {
  const info = STAGE_INFO[stage || 'extracting'] || STAGE_INFO.extracting;

  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
      </div>

      {/* Current stage */}
      <p className="text-base font-medium text-gray-700">
        {info.label}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        {info.estimate}
      </p>

      {/* Live token preview during generation */}
      {stage === 'generating' && tokens && (
        <div className="mt-6 w-full max-w-lg">
          <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="ml-2 text-[10px] text-gray-500">AI 实时输出</span>
            </div>
            <pre className="text-xs text-green-400 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-32 overflow-y-auto scroll-smooth">
              {tokens}
              <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-0.5" />
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
