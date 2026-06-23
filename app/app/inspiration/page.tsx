'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '@/lib/client-id';
import { INSPIRATION_CATEGORIES, type InspirationCategory, type InspirationResponse, type InspirationItem } from '@/lib/types';

type PageState = 'idle' | 'loading' | 'success' | 'error';

export default function InspirationPage() {
  const [category, setCategory] = useState<InspirationCategory>('ai-tools');
  const [state, setState] = useState<PageState>('idle');
  const [data, setData] = useState<InspirationResponse | null>(null);
  const [error, setError] = useState('');
  const [stale, setStale] = useState(false);

  const fetchData = useCallback(async (cat: InspirationCategory, force = false) => {
    setState('loading');
    setError('');
    setStale(false);

    try {
      const res = await fetch(`/api/inspiration?category=${cat}&t=${Date.now()}`, {
        headers: { ...getAuthHeaders() },
      });

      if (res.status === 429) {
        setError('请勿频繁刷新，30 秒后再试');
        setState('error');
        return;
      }

      if (!res.ok) {
        throw new Error('获取灵感数据失败');
      }

      const isStale = res.headers.get('X-Data-Stale') === '1';
      const json: InspirationResponse = await res.json();
      setData(json);
      setStale(!!json.cached || isStale);
      setState('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : '网络异常，请稍后重试');
      setState('error');
    }
  }, []);

  // Load on mount and category change
  useEffect(() => {
    fetchData(category);
  }, [category, fetchData]);

  return (
    <div className="min-h-screen" style={{background:'var(--bg-gradient)'}}>
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">灵感市集</h1>
          <p className="text-gray-500">发现最新热点和产品机会</p>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 justify-center" style={{scrollbarWidth:'none'}}>
          {INSPIRATION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`shrink-0 text-sm rounded-full px-4 py-1.5 font-medium transition-all ${
                category === cat.id
                  ? 'text-white gradient-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={category !== cat.id ? {
                background:'rgba(255,255,255,0.3)',
                backdropFilter:'blur(8px)',
                border:'1px solid rgba(255,255,255,0.3)',
              } : {
                boxShadow:'0 2px 8px rgba(79,139,255,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stale banner */}
        {stale && state === 'success' && (
          <div className="max-w-lg mx-auto mb-6 flex items-center justify-center gap-2 text-xs" style={{color:'rgba(0,0,0,0.4)'}}>
            <span>数据来自缓存</span>
            <button
              onClick={() => fetchData(category, true)}
              className="underline hover:text-blue-500 transition-colors"
            >
              刷新
            </button>
          </div>
        )}

        {/* Content */}
        {state === 'loading' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl p-5 animate-pulse" style={{background:'rgba(255,255,255,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)'}}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
                <div className="flex gap-2 mb-3">
                  <div className="h-5 bg-gray-100 rounded-full w-14" />
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {state === 'error' && (
          <div className="max-w-sm mx-auto text-center py-16">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-1">获取数据失败</p>
            <p className="text-sm text-gray-400 mb-6">{error}</p>
            <button
              onClick={() => fetchData(category, true)}
              className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-medium text-white transition-all active:scale-[0.98]"
              style={{boxShadow:'0 2px 16px rgba(79,139,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'}}
            >
              重试
            </button>
          </div>
        )}

        {state === 'idle' && !data && (
          <div className="max-w-sm mx-auto text-center py-16">
            <p className="text-gray-400">选择一个分类查看最新趋势</p>
          </div>
        )}

        {state === 'success' && data && (
          <>
            {/* Summary */}
            <div className="max-w-3xl mx-auto mb-8">
              <div className="rounded-xl p-5 liquid-glass">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm" style={{filter:'drop-shadow(0 1px 2px rgba(79,139,255,0.2))'}}>📊</span>
                  <h2 className="text-sm font-semibold text-gray-900">趋势概述</h2>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{data.summary}</p>
              </div>
            </div>

            {/* Cards grid */}
            {data.items.length === 0 ? (
              <div className="max-w-sm mx-auto text-center py-16">
                <p className="text-gray-400 mb-2">暂无相关灵感</p>
                <p className="text-xs text-gray-300">换个分类试试，或稍后再来</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {data.items.map((item, i) => (
                  <InspirationCard key={i} item={item} />
                ))}
              </div>
            )}

            {/* Footer attribution */}
            {data.sources && data.sources.length > 0 && (
              <div className="max-w-4xl mx-auto mt-8 pt-6 border-t border-[rgba(255,255,255,0.3)]">
                <p className="text-xs text-gray-400 mb-2 text-center">数据来源</p>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {data.sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-blue-500 transition-colors">
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InspirationCard({ item }: { item: InspirationItem }) {
  return (
    <div className="rounded-xl p-5 transition-all hover:shadow-md" style={{
      border:'1px solid var(--glass-border)',
      background:'var(--glass-bg)',
      backdropFilter:'blur(28px) saturate(160%) contrast(1.02)',
      boxShadow:'var(--glass-shadow)',
    }}>
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-900 mb-2 leading-snug">{item.title}</h3>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {item.tags.map((tag, i) => (
            <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{color:'#4F8BFF', background:'rgba(79,139,255,0.08)'}}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Summary */}
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">{item.summary}</p>

      {/* Why hot */}
      <div className="mb-2">
        <span className="text-[11px] font-medium text-gray-700">🔥 为什么火</span>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.why_hot}</p>
      </div>

      {/* Product opportunity */}
      <div className="mb-3">
        <span className="text-[11px] font-medium text-gray-700">💡 产品机会</span>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.product_opportunity}</p>
      </div>

      {/* Source link */}
      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] font-medium transition-colors"
        style={{color:'#4F8BFF'}}
      >
        {item.source_label || '查看来源'}
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
