import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Category, EntryInput, KnowledgeEntry } from '../types'

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  initial?: KnowledgeEntry | null
  onSubmit: (input: EntryInput) => Promise<void>
}

const empty: EntryInput = {
  title: '',
  category_id: null,
  symptom: '',
  root_cause: '',
  solution: '',
  failed_attempts: '',
  tags: [],
}

export function EntryFormDrawer({
  open,
  onClose,
  categories,
  initial,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<EntryInput>(empty)
  const [tagText, setTagText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        category_id: initial.category_id,
        symptom: initial.symptom,
        root_cause: initial.root_cause,
        solution: initial.solution,
        failed_attempts: initial.failed_attempts,
        tags: [...initial.tags],
      })
      setTagText(initial.tags.join(', '))
    } else {
      setForm({
        ...empty,
        category_id: categories[0]?.id ?? null,
      })
      setTagText('')
    }
    setError(null)
  }, [open, initial, categories])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const set =
    (key: keyof EntryInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
    }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="關閉" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-[slideIn_0.2s_ease]">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {initial ? '編輯條目' : '新增條目'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={async (e) => {
            e.preventDefault()
            setSaving(true)
            setError(null)
            try {
              const tags = tagText
                .split(/[,，]/)
                .map((t) => t.trim())
                .filter(Boolean)
              await onSubmit({ ...form, tags })
              onClose()
            } catch (err) {
              setError(err instanceof Error ? err.message : '儲存失敗')
            } finally {
              setSaving(false)
            }
          }}
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <Field label="標題 *">
              <input
                required
                value={form.title}
                onChange={set('title')}
                className="field"
                placeholder="例如：小孔 Washer 網格外圈不規則"
              />
            </Field>
            <Field label="分類">
              <select
                value={form.category_id ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category_id: e.target.value || null,
                  }))
                }
                className="field"
              >
                <option value="">未分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="遇到的現象">
              <textarea
                value={form.symptom}
                onChange={set('symptom')}
                rows={3}
                className="field"
              />
            </Field>
            <Field label="原因判斷">
              <textarea
                value={form.root_cause}
                onChange={set('root_cause')}
                rows={3}
                className="field"
              />
            </Field>
            <Field label="解決方法">
              <textarea
                value={form.solution}
                onChange={set('solution')}
                rows={4}
                className="field"
              />
            </Field>
            <Field label="無效嘗試">
              <textarea
                value={form.failed_attempts}
                onChange={set('failed_attempts')}
                rows={3}
                className="field"
              />
            </Field>
            <Field label="關鍵字（逗號分隔）">
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                className="field"
                placeholder="washer, 小孔, batchmesh"
              />
            </Field>
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? '儲存中…' : '儲存'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .field {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .field:focus {
          border-color: #0d9488;
          box-shadow: 0 0 0 3px rgb(13 148 136 / 0.15);
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  )
}
