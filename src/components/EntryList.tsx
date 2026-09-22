import { Search, ArrowUpDown } from 'lucide-react'
import type { KnowledgeBaseState } from '../hooks/useKnowledgeBase'
import { formatDate, highlightText, snippet } from '../lib/utils'
import type { SortMode } from '../types'

type Props = {
  kb: KnowledgeBaseState
  onSelect: (id: string) => void
  mobileShowDetail: boolean
}

export function EntryList({ kb, onSelect, mobileShowDetail }: Props) {
  const categoryName = (id: string | null) =>
    kb.categories.find((c) => c.id === id)?.name ?? '未分類'

  return (
    <section
      className={`flex min-h-0 w-full flex-col border-r border-slate-200 bg-white md:w-[360px] lg:w-[380px] ${
        mobileShowDetail ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="border-b border-slate-100 p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={kb.search}
            onChange={(e) => kb.setSearch(e.target.value)}
            placeholder="搜尋標題、現象、原因、解法、Tag…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-14 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
          />
          <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">
            ⌘ K
          </kbd>
        </div>
      </div>

      <div className="space-y-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              知識庫條目
            </h2>
            <p className="text-xs text-slate-500">{kb.filtered.length} 個條目</p>
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            <ArrowUpDown size={12} />
            <select
              value={kb.sort}
              onChange={(e) => kb.setSort(e.target.value as SortMode)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-teal-500"
            >
              <option value="newest">最新更新</option>
              <option value="oldest">最早更新</option>
              <option value="title">標題</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            active={kb.view === 'all' || (kb.view === 'category' && !kb.categoryFilter)}
            onClick={() => {
              kb.setView('all')
              kb.setCategoryFilter(null)
            }}
            label="All"
          />
          {kb.categories.map((c) => (
            <FilterChip
              key={c.id}
              active={kb.view === 'category' && kb.categoryFilter === c.id}
              onClick={() => {
                kb.setView('category')
                kb.setCategoryFilter(c.id)
              }}
              label={c.name}
            />
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {kb.loading && (
          <div className="px-2 py-8 text-center text-sm text-slate-400">載入中…</div>
        )}
        {!kb.loading && kb.filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-400">
            {kb.view === 'trash' ? '回收桶是空的' : '沒有符合的條目'}
          </div>
        )}
        <ul className="space-y-2">
          {kb.filtered.map((entry) => {
            const active = entry.id === kb.selectedId
            const cat = categoryName(entry.category_id)
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left transition ${
                    active
                      ? 'border-teal-200 bg-teal-50/60 shadow-sm ring-1 ring-teal-500/20 border-l-4 border-l-teal-600'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-display text-sm font-semibold text-slate-900"
                      dangerouslySetInnerHTML={{
                        __html: highlightText(entry.title, kb.search),
                      }}
                    />
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">
                      {formatDate(entry.updated_at)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-[10px] font-medium text-teal-800">
                      {cat}
                    </span>
                    {entry.tags.slice(0, 2).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                    {entry.is_favorite && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700">
                        ★
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        snippet(entry.symptom || entry.solution || entry.root_cause),
                        kb.search,
                      ),
                    }}
                  />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? 'bg-slate-800 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  )
}
