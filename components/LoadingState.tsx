'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { label: '理解你的想法...', duration: 3000 },
  { label: '搜索同类产品...', duration: 5000 },
  { label: '分析市场数据...', duration: 5000 },
  { label: '生成验证报告...', duration: 4000 },
];

export default function LoadingState() {
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Cycle through steps
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    const totalDuration = STEPS.reduce((sum, s) => sum + s.duration, 0);

    STEPS.forEach((step, i) => {
      const t = setTimeout(() => {
        setStepIndex(i);
        setProgress(0);
      }, elapsed);
      timers.push(t);
      elapsed += step.duration;
    });

    // Smooth progress within current step
    const step = STEPS[stepIndex];
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 8;
        return next > 85 ? 85 : next;
      });
    }, 400);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, []);

  // Progress across all steps (0-100)
  const totalElapsed = STEPS.slice(0, stepIndex).reduce((s, st) => s + st.duration, 0);
  const currentStepElapsed = (progress / 100) * STEPS[stepIndex].duration;
  const totalProgress = Math.min(
    ((totalElapsed + currentStepElapsed) / STEPS.reduce((s, st) => s + st.duration, 0)) * 100,
    95
  );

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

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Step label */}
      <p className="text-base font-medium text-gray-700">
        {STEPS[stepIndex].label}
      </p>
      <p className="text-sm text-gray-400 mt-1">
        大约需要 30-60 秒
      </p>
    </div>
  );
}
