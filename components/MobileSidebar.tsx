'use client';

import React, { useMemo } from 'react';

// ── Types ──

export interface SidebarHistoryItem {
  id: string;
  title: string;
  timestamp: number;
  isUnread: boolean;
  isActive: boolean;
}

export interface SidebarHistoryGroup {
  label: string;
  items: SidebarHistoryItem[];
}

export interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat?: () => void;
  historyGroups?: SidebarHistoryGroup[];
  onItemClick?: (id: string) => void;
  onItemMenu?: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// ── Icons ──

const IconSearch = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);
const IconPlus = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5v14" />
  </svg>
);
const IconChevronRight = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);
const IconMore = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);
const IconScan = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2M3 17v2a2 2 0 0 0 2 2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 12h10" />
  </svg>
);
const IconBell = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const IconClose = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
const IconSpace = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 9h6M9 13h6M9 17h4" />
  </svg>
);
const IconAgent = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);
const IconRefresh = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
const IconHistory = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

// ── Skeleton ──

function HistorySkeleton() {
  return (
    <div className="space-y-3 px-4 animate-pulse">
      <div className="h-4 w-16 bg-neutral-800 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <div className="h-3 w-3 rounded-full bg-neutral-800" />
          <div className="h-4 flex-1 bg-neutral-800 rounded" />
          <div className="h-3 w-8 bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Mock data ──

function generateMockHistory(): SidebarHistoryGroup[] {
  const now = Date.now();
  const day = 86400000;
  return [
    {
      label: '今天',
      items: [
        { id: '1', title: '产品需求分析文档', timestamp: now - 3600000, isUnread: true, isActive: false },
        { id: '2', title: '用户增长策略讨论', timestamp: now - 7200000, isUnread: false, isActive: true },
        { id: '3', title: '竞品调研报告', timestamp: now - 14400000, isUnread: false, isActive: false },
      ],
    },
    {
      label: '最近一周',
      items: [
        { id: '4', title: '2026年度产品路线图规划', timestamp: now - 3 * day, isUnread: false, isActive: false },
        { id: '5', title: '市场定位与目标用户分析', timestamp: now - 4 * day, isUnread: true, isActive: false },
        { id: '6', title: 'A/B测试方案设计', timestamp: now - 5 * day, isUnread: false, isActive: false },
      ],
    },
  ];
}

// ── History Item ──

function HistoryListItem({ item, isActive, onClick, onMenu }: {
  item: SidebarHistoryItem;
  isActive: boolean;
  onClick: () => void;
  onMenu: () => void;
}) {
  return (
    <div
      className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer rounded-xl transition-all duration-150 ${
        isActive ? 'bg-[#2C2C2C]' : 'hover:bg-neutral-900 active:bg-neutral-800'
      }`}
      onClick={onClick}
    >
      <div className="w-4 flex justify-center shrink-0">
        {item.isUnread && <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />}
      </div>
      <span className={`flex-1 text-sm truncate select-none ${isActive ? 'text-white' : 'text-neutral-200'}`}>
        {item.title}
      </span>
      <span
        className={`shrink-0 text-neutral-500 transition-opacity duration-150 ${
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        onClick={(e) => { e.stopPropagation(); onMenu(); }}
      >
        <IconMore size={18} />
      </span>
    </div>
  );
}

// ── Main Component ──

export default function MobileSidebar({
  isOpen,
  onClose,
  onNewChat,
  historyGroups: externalHistory,
  onItemClick,
  onItemMenu,
  loading: externalLoading,
  error: externalError,
  onRetry,
}: MobileSidebarProps) {
  const [internalActiveId, setInternalActiveId] = React.useState('2');

  const resolvedHistory = useMemo(
    () => externalHistory ?? generateMockHistory(),
    [externalHistory],
  );

  const loading = externalLoading ?? false;
  const error = externalError ?? null;

  const handleItemClick = (id: string) => {
    setInternalActiveId(id);
    onItemClick?.(id);
  };

  const handleMenu = (id: string) => onItemMenu?.(id);

  const handleNewChat = () => onNewChat?.();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <aside
        className="absolute left-0 top-0 h-full bg-black flex flex-col border-r border-neutral-900 z-10"
        style={{
          width: 'min(75vw, 320px)',
          animation: 'jiezi-sidebar-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Inject keyframe */}
        <style>{`@keyframes jiezi-sidebar-slide-in{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>

        {/* ── Header ── */}
        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-neutral-900">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-white tracking-wide">千问</span>
            <div className="flex items-center gap-4">
              <button className="text-neutral-400 hover:text-white transition-colors" aria-label="搜索">
                <IconSearch size={20} />
              </button>
              <button className="text-neutral-400 hover:text-white transition-colors" onClick={onClose} aria-label="关闭">
                <IconClose size={20} />
              </button>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] active:bg-[#333] text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
            onClick={handleNewChat}
          >
            <IconPlus size={18} />
            <span>新建对话</span>
          </button>
        </div>

        {/* ── Menu ── */}
        <div className="shrink-0 px-3 pt-4 pb-2 space-y-1">
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-neutral-300 hover:bg-neutral-900 active:bg-neutral-800 transition-colors text-sm">
            <span className="flex items-center gap-3"><IconSpace size={20} /><span>我的空间</span></span>
            <IconChevronRight size={16} />
          </button>
          <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-neutral-300 hover:bg-neutral-900 active:bg-neutral-800 transition-colors text-sm">
            <span className="flex items-center gap-3"><IconAgent size={20} /><span>智能体</span></span>
            <IconChevronRight size={16} />
          </button>
        </div>

        {/* ── Section label ── */}
        <div className="shrink-0 px-4 pt-4 pb-2">
          <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
            <IconHistory size={14} />历史对话
          </span>
        </div>

        {/* ── History ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-4">
          {loading && <HistorySkeleton />}
          {error && !loading && (
            <div className="flex flex-col items-center py-12 px-4 text-center">
              <span className="text-neutral-500 text-sm mb-3">{error}</span>
              <button className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors" onClick={onRetry}>
                <IconRefresh size={14} />重试
              </button>
            </div>
          )}
          {!loading && !error && resolvedHistory.length === 0 && (
            <div className="flex flex-col items-center py-12 px-4 text-center">
              <IconHistory size={32} />
              <span className="text-neutral-500 text-sm mt-3">暂无对话记录</span>
              <span className="text-neutral-600 text-xs mt-1">开始新对话吧</span>
            </div>
          )}
          {!loading && !error && resolvedHistory.map((group) => (
            <div key={group.label} className="mb-3">
              <span className="block px-2 py-1.5 text-xs text-neutral-600 font-medium">{group.label}</span>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <HistoryListItem
                    key={item.id}
                    item={item}
                    isActive={externalHistory ? item.isActive : item.id === internalActiveId}
                    onClick={() => handleItemClick(item.id)}
                    onMenu={() => handleMenu(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom User ── */}
        <div className="shrink-0 border-t border-neutral-900 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shrink-0 flex items-center justify-center text-white text-sm font-semibold">U</div>
              <div className="min-w-0">
                <p className="text-sm text-white font-medium truncate">用户昵称</p>
                <p className="text-xs text-neutral-500 truncate">查看个人资料</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button className="text-neutral-500 hover:text-white transition-colors" aria-label="扫一扫"><IconScan size={20} /></button>
              <button className="text-neutral-500 hover:text-white transition-colors relative" aria-label="通知">
                <IconBell size={20} />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
