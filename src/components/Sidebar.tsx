import type { ReactNode } from 'react'
import {
  BookOpen,
  Cloud,
  Heart,
  Clock3,
  Trash2,
  Plus,
  FolderPlus,
  Settings2,
  Menu,
  X,
} from 'lucide-react'
import type { KnowledgeBaseState } from '../hooks/useKnowledgeBase'
import { formatDateTime } from '../lib/utils'

type Props = {
  kb: KnowledgeBaseState
  open: boolean
  onClose: () => void
  onAddEntry: () => void
  onManageCategories: () => void
}

export function Sidebar({
  kb,
  open,
  onClose,
  onAddEntry,
  onManageCategories,
}: Props) {
  const navBtn = (
    active: boolean,
    onClick: () => void,
    icon: ReactNode,
    label: string,
    count?: number,
  ) => (
    <button
      type="button"
      onClick={() => {
        onClick()
        onClose()
      }}
      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition ${
        active
          ? 'bg-teal-700/50 text-white shadow-sm ring-1 ring-teal-500/40'
          : 'text-teal-50/80 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className="opacity-90">{icon}</span>
      <span className="flex-1 truncate font-medium">{label}</span>
      {typeof count === 'number' && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
            active ? 'bg-black/20 text-teal-100' : 'bg-white/10 text-teal-100/70'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  )

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="關閉選單"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-sidebar text-white shadow-xl transition-transform lg:static lg:z-0 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-xs font-bold tracking-wide">
            CAE
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[15px] font-semibold leading-tight">
              CAE Knowledge Base
            </div>
            <div className="mt-0.5 text-xs text-teal-200/70">Shared cloud tool</div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-teal-100/70 hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="關閉"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1 px-3 pt-4">
          {navBtn(
            kb.view === 'all' || (kb.view === 'category' && !kb.categoryFilter),
            () => {
              kb.setView('all')
              kb.setCategoryFilter(null)
            },
            <BookOpen size={16} />,
            'Knowledge Base',
          )}
          <button
            type="button"
            onClick={() => {
              onAddEntry()
              onClose()
            }}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/25 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Plus size={16} />
            新增條目
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto px-3 pb-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-200/60">
              分類瀏覽
            </span>
            <button
              type="button"
              title="管理分類"
              onClick={() => {
                onManageCategories()
                onClose()
              }}
              className="rounded p-1 text-teal-200/70 hover:bg-white/10 hover:text-white"
            >
              <Settings2 size={14} />
            </button>
          </div>

          {navBtn(kb.view === 'all' && !kb.categoryFilter, () => {
            kb.setView('all')
            kb.setCategoryFilter(null)
          }, <span className="text-xs font-bold">∀</span>, 'All', kb.counts.all)}

          {kb.categories.map((cat) =>
            navBtn(
              kb.view === 'category' && kb.categoryFilter === cat.id,
              () => {
                kb.setView('category')
                kb.setCategoryFilter(cat.id)
              },
              <span className="h-1.5 w-1.5 rounded-full bg-accent-bright" />,
              cat.name,
              kb.counts.byCat[cat.id] ?? 0,
            ),
          )}

          <button
            type="button"
            onClick={() => {
              onManageCategories()
              onClose()
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-teal-200/60 hover:bg-white/5 hover:text-teal-100"
          >
            <FolderPlus size={14} />
            管理分類
          </button>

          <div className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-wider text-teal-200/60">
            系統檢視
          </div>
          {navBtn(
            kb.view === 'favorites',
            () => {
              kb.setView('favorites')
              kb.setCategoryFilter(null)
            },
            <Heart size={16} />,
            '我的最愛',
            kb.counts.favorites,
          )}
          {navBtn(
            kb.view === 'recent',
            () => {
              kb.setView('recent')
              kb.setCategoryFilter(null)
            },
            <Clock3 size={16} />,
            '最近查看',
            kb.counts.recent,
          )}
          {navBtn(
            kb.view === 'trash',
            () => {
              kb.setView('trash')
              kb.setCategoryFilter(null)
            },
            <Trash2 size={16} />,
            '回收桶',
            kb.counts.trash,
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Cloud size={18} className="text-teal-100/80" />
              <span
                className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ring-2 ring-sidebar ${
                  kb.sync.mode === 'supabase' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </div>
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-teal-50">
                {kb.sync.message}
              </div>
              <div className="truncate text-[10px] text-teal-200/50">
                {kb.sync.lastSyncedAt
                  ? `Last synced ${formatDateTime(kb.sync.lastSyncedAt)}`
                  : '設定 .env 後連線 Supabase'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileTopBar({
  onMenu,
  title,
}: {
  onMenu: () => void
  title: string
}) {
  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 lg:hidden">
      <button
        type="button"
        onClick={onMenu}
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        aria-label="開啟選單"
      >
        <Menu size={20} />
      </button>
      <div className="font-display text-sm font-semibold text-slate-800">{title}</div>
    </div>
  )
}
