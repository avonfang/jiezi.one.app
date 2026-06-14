'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { HistoryItem } from '@/lib/types';

type Filter = 'all' | 'positive' | 'caution' | 'negative';

const POSITIVE_VERDICTS = ['建议尝试', '推荐做'];
const CAUTION_VERDICTS = ['值得探索', '谨慎做'];
const NEGATIVE_VERDICTS = ['暂不建议', '不建议做'];

const VERDICT_CONFIG: Record<string, { icon: string; bar: string; label: string }> = {
  '建议尝试': { icon: '🟢', bar: 'bg-green-500', label: '建议尝试' },
  '推荐做': { icon: '🟢', bar: 'bg-green-500', label: '推荐做' },
  '值得探索': { icon: '🟡', bar: 'bg-yellow-500', label: '值得探索' },
  '谨慎做': { icon: '🟡', bar: 'bg-yellow-500', label: '谨慎做' },
  '暂不建议': { icon: '🔴', bar: 'bg-red-500', label: '暂不建议' },
  '不建议做': { icon: '🔴', bar: 'bg-red-500', label: '不建议做' },
};

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'positive', label: '建议做' },
  { key: 'caution', label: '待评估' },
  { key: 'negative', label: '不建议' },
];

function getVerdictGroup(verdict: string): Filter {
  if (POSITIVE_VERDICTS.includes(verdict)) return 'positive';
  if (CAUTION_VERDICTS.includes(verdict)) return 'caution';
  if (NEGATIVE_VERDICTS.includes(verdict)) return 'negative';
  return 'caution';
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  const loadHistory = useCallback(() => {
    try {
      const raw = localStorage.getItem('jiezi-history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.sort((a: HistoryItem, b: HistoryItem) => b.timestamp - a.timestamp));
          return;
        }
      }
    } catch { /* ignore */ }
    setItems([]);
  }, []);

  useEffect(loadHistory, [loadHistory]);

  // Listen for storage changes (e.g. when deleting from another tab)
  useEffect(() => {
    const handler = () => loadHistory();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [loadHistory]);

  const persist = (updated: HistoryItem[]) => {
    localStorage.setItem('jiezi-history', JSON.stringify(updated));
    setItems(updated.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleRestore = (item: HistoryItem) => {
    localStorage.setItem('jiezi-full-report', JSON.stringify({ idea: item.idea, report: item.report }));
    router.push('/app');
  };

  const handleDelete = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    persist(updated);
  };

  const handleClearAll = () => {
    persist([]);
    setConfirmClear(false);
  };

  const filtered = filter === 'all' ? items : items.filter(i => getVerdictGroup(i.report.verdict) === filter);

  const stats = {
    total: items.length,
    positive: items.filter(i => POSITIVE_VERDICTS.includes(i.report.verdict)).length,
    caution: items.filter(i => CAUTION_VERDICTS.includes(i.report.verdict)).length,
    negative: items.filter(i => NEGATIVE_VERDICTS.includes(i.report.verdict)).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <a href="/app" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← 返回
            </a>
            <h1 className="text-lg font-bold text-gray-900">历史记录</h1>
          </div>
          {items.length > 0 && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              清空全部
            </button>
          )}
          {confirmClear && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-500">确认清空？</span>
              <button onClick={handleClearAll} className="text-xs text-red-500 font-medium hover:text-red-600">确认</button>
              <button onClick={() => setConfirmClear(false)} className="text-xs text-gray-400 hover:text-gray-600">取消</button>
            </div>
          )}
        </div>

        {/* Stats summary */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.total}</p>
                <p className="text-[10px] text-gray-400">全部</p>
              </div>
              <div>
                <p className="text-lg font-bold text-green-600">{stats.positive}</p>
                <p className="text-[10px] text-gray-400">建议做</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-600">{stats.caution}</p>
                <p className="text-[10px] text-gray-400">待评估</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-500">{stats.negative}</p>
                <p className="text-[10px] text-gray-400">不建议</p>
              </div>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {items.length > 0 && (
          <div className="flex items-center gap-1 mb-4">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🌱</p>
            <p className="text-gray-500 text-sm mb-6">还没有验证记录</p>
            <a
              href="/"
              className="inline-block rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-2.5 text-sm font-medium text-white hover:from-emerald-600 hover:to-green-600 transition-all shadow-sm"
            >
              开始验证第一个想法
            </a>
          </div>
        )}

        {/* List */}
        {filtered.length > 0 && (
          <div className="space-y-2">
            {filtered.map(item => {
              const vc = VERDICT_CONFIG[item.report.verdict] || VERDICT_CONFIG['值得探索'];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors group"
                >
                  <button
                    onClick={() => handleRestore(item)}
                    className="w-full flex items-stretch text-left group"
                  >
                    {/* Verdict color bar */}
                    <div className={`w-1 shrink-0 ${vc.bar}`} />
                    <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
                      <span className="text-base shrink-0">{vc.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900 truncate">{item.idea}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(item.timestamp).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.prd && (
                          <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded font-medium">PRD</span>
                        )}
                        {item.preview && (
                          <span className="text-[10px] bg-purple-50 text-purple-500 px-1.5 py-0.5 rounded font-medium">预览</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="ml-1 text-[10px] text-gray-300 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all shrink-0"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom spacer */}
        {items.length > 0 && <div className="h-12" />}
      </div>
    </div>
  );
}
