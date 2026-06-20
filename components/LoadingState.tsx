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
  showTagline,
}: {
  stage?: string;
  message?: string;
  steps?: { stage: string; label: string }[];
  showTagline?: boolean;
}) {
  const stepList = steps || VALIDATION_STEPS;
  const currentIdx = getStepIndex(stepList, stage || stepList[0]?.stage || '');

  return (
    <div className="flex flex-col items-center py-8">
      {showTagline && (
        <div className="text-center mb-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
            从一句话想法
            <br className="sm:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8BFF] to-[#7C6CF0]">
              到可落地的产品原型
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            输入产品想法 → AI 自动验证市场方向、分析竞品、生成 PRD 和产品预览页
          </p>
          <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400">
            <svg className="w-3 h-3 text-[#4F8BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            基于 AI + 实时搜索分析
          </div>
        </div>
      )}

      <div className="relative w-14 h-14 mb-10">
        <div className="absolute inset-0 rounded-full border-3" style={{borderColor:'rgba(79,139,255,0.1)'}} />
        <div
          className="absolute inset-0 rounded-full border-3 border-transparent animate-spin" style={{borderTopColor:'#4F8BFF', animationDuration:'0.8s'}}
        />
      </div>

      <div className="space-y-3 text-sm">
        {stepList.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={step.stage} className="flex items-center gap-3">
              <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                {isDone ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                ) : isCurrent ? (
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{background:'rgba(79,139,255,0.1)'}}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{background:'#4F8BFF'}} />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                )}
              </div>

              <span className={`transition-colors ${
                isDone ? 'text-gray-400' :
                isCurrent ? 'text-gray-900 font-medium' :
                'text-gray-300'
              }`}>
                {step.label}
              </span>

              {isCurrent && message && (
                <span className="text-xs ml-1 animate-fadeIn" style={{color:'#4F8BFF'}}>{message}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
