'use client';

const VALIDATION_STEPS = [
  { stage: 'extracting', label: '分析产品想法' },
  { stage: 'searching', label: '搜索市场竞品' },
  { stage: 'analyzing', label: '分析市场需求' },
  { stage: 'generating', label: '生成验证报告' },
];

function getStepIndex(steps: { stage: string }[], stage: string): number {
  return steps.findIndex(s => s.stage === stage);
}

export default function LoadingState({
  stage,
  message,
  steps,
}: {
  stage?: string;
  message?: string;
  steps?: { stage: string; label: string }[];
}) {
  const stepList = steps || VALIDATION_STEPS;
  const currentIdx = getStepIndex(stepList, stage || stepList[0]?.stage || '');

  return (
    <div className="flex flex-col items-center py-16">
      {/* Spinner */}
      <div className="relative w-14 h-14 mb-10">
        <div className="absolute inset-0 rounded-full border-3 border-indigo-100" />
        <div
          className="absolute inset-0 rounded-full border-3 border-transparent border-t-indigo-500 animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
      </div>

      {/* Step timeline */}
      <div className="space-y-3 text-sm">
        {stepList.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={step.stage} className="flex items-center gap-3">
              {/* Status indicator */}
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                )}
              </div>

              {/* Label */}
              <span className={`transition-colors ${
                isDone ? 'text-gray-400' :
                isCurrent ? 'text-gray-900 font-medium' :
                'text-gray-300'
              }`}>
                {step.label}
              </span>

              {/* Extra info for current step */}
              {isCurrent && message && (
                <span className="text-xs text-indigo-500 ml-1 animate-[fadeIn_0.3s_ease-out]">{message}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
