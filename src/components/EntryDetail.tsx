import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Search,
  Lightbulb,
  XCircle,
  Tags,
  Calendar,
  Star,
  Pencil,
  Trash2,
  RotateCcw,
  Ban,
  ChevronLeft,
} from 'lucide-react'
import type { KnowledgeBaseState } from '../hooks/useKnowledgeBase'
import { formatDate } from '../lib/utils'
import { ImageGallery } from './ImageGallery'

type Props = {
  kb: KnowledgeBaseState
  mobileShowDetail: boolean
  onBack: () => void
  onEdit: () => void
}

export function EntryDetail({ kb, mobileShowDetail, onBack, onEdit }: Props) {
  const entry = kb.selected
  const images = entry ? (kb.imagesByEntry[entry.id] ?? []) : []
  const cat = entry
    ? kb.categories.find((c) => c.id === entry.category_id)?.name
    : null
  const [busy, setBusy] = useState(false)

  if (!entry) {
    return (
      <section
        className={`min-h-0 flex-1 flex-col bg-surface ${
          mobileShowDetail ? 'flex' : 'hidden md:flex'
        }`}
      >
        <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
          選擇左側條目以查看詳情
        </div>
      </section>
    )
  }

  const inTrash = Boolean(entry.deleted_at)

  return (
    <section
      className={`min-h-0 flex-1 flex-col overflow-y-auto bg-surface ${
        mobileShowDetail ? 'flex' : 'hidden md:flex'
      }`}
    >
      <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-surface/95 px-4 py-3 backdrop-blur md:px-6">
        <div className="mb-2 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white"
          >
            <ChevronLeft size={16} />
            返回列表
          </button>
        </div>
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-400">
          <span>Knowledge Base</span>
          {cat && (
            <>
              <span>›</span>
              <span>{cat}</span>
            </>
          )}
          <span>›</span>
          <span className="truncate text-slate-600">{entry.title}</span>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
            {entry.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            {!inTrash && (
              <>
                <button
                  type="button"
                  title={entry.is_favorite ? '取消最愛' : '加入最愛'}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await kb.toggleFavorite(entry.id, !entry.is_favorite)
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className={`rounded-lg border px-2.5 py-1.5 text-sm transition ${
                    entry.is_favorite
                      ? 'border-amber-200 bg-amber-50 text-amber-600'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Star
                    size={16}
                    fill={entry.is_favorite ? 'currentColor' : 'none'}
                  />
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Pencil size={14} />
                  編輯
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm('移至回收桶？')) return
                    setBusy(true)
                    try {
                      await kb.softDelete(entry.id)
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-100"
                >
                  <Trash2 size={14} />
                  刪除
                </button>
              </>
            )}
            {inTrash && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await kb.restore(entry.id)
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-sm text-teal-700 hover:bg-teal-100"
                >
                  <RotateCcw size={14} />
                  還原
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    if (!confirm('永久刪除並清除圖片？此操作無法復原。')) return
                    setBusy(true)
                    try {
                      await kb.purge(entry.id)
                    } finally {
                      setBusy(false)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-600 px-2.5 py-1.5 text-sm text-white hover:bg-red-700"
                >
                  <Ban size={14} />
                  永久刪除
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cat && (
            <span className="rounded-md bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
              {cat}
            </span>
          )}
          {entry.tags.map((t) => (
            <span
              key={t}
              className="rounded-md bg-slate-200/70 px-2 py-0.5 text-xs text-slate-600"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-4 py-5 md:px-6">
        <Section
          icon={<AlertTriangle size={16} className="text-amber-500" />}
          title="遇到的現象"
          body={entry.symptom}
        />
        <Section
          icon={<Search size={16} className="text-sky-500" />}
          title="原因判斷"
          body={entry.root_cause}
        />
        <Section
          icon={<Lightbulb size={16} className="text-emerald-500" />}
          title="解決方法"
          body={entry.solution}
        />
        <Section
          icon={<XCircle size={16} className="text-rose-500" />}
          title="無效嘗試"
          body={entry.failed_attempts}
        />
        <Section
          icon={<Tags size={16} className="text-violet-500" />}
          title="關鍵字"
          body={entry.tags.join(', ') || '—'}
        />
        <Section
          icon={<Calendar size={16} className="text-slate-400" />}
          title="更新日期"
          body={formatDate(entry.updated_at)}
        />

        {!inTrash && (
          <ImageGallery
            entryId={entry.id}
            images={images}
            onUpload={(files) => kb.uploadImages(entry.id, files)}
            onDelete={(img) => kb.removeImage(img)}
            onReorder={(ids) => kb.reorderImages(entry.id, ids)}
          />
        )}
      </div>
    </section>
  )
}

function Section({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-800">
        {icon}
        {title}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {body || '—'}
      </p>
    </div>
  )
}

/** Prefetch keyboard shortcut focus for search — kept for App wiring */
export function useSearchHotkey(inputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inputRef])
}
