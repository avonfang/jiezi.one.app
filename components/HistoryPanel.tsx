'use client';

import type { HistoryItem } from '@/lib/types';

interface HistoryPanelProps {
  items: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const VERDICT_ICONS: Record<string, string> = {
  '建议尝试': '🟢',
  '推荐做': '🟢',
  '值得探索': '🟡',
  '谨慎做': '🟡',
  '暂不建议': '🔴',
  '不建议做': '🔴',
};

export default function HistoryPanel({ items, onRestore, onDelete }: HistoryPanelProps) {
  if (items.length === 0) return null;

  const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          历史验证
        </h3>
        <span className="text-xs text-gray-400">{items.length} 条记录</span>
      </div>
      <div className="space-y-2">
        {sorted.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors group"
          >
            <button
              onClick={() => onRestore(item)}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <span>{VERDICT_ICONS[item.report.verdict] || '🟡'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{item.idea}</p>
                <p className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleDateString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {item.prd && ' · 已生成 PRD'}
                  {item.preview && ' · 已生成预览页'}
                </p>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="shrink-0 text-xs text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              title="删除"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
