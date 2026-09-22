import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Category } from '../types'

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  counts: Record<string, number>
  onAdd: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReorder: (ids: string[]) => Promise<void>
}

export function CategoryManager({
  open,
  onClose,
  categories,
  counts,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}: Props) {
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= categories.length) return
    const ids = categories.map((c) => c.id)
    ;[ids[index], ids[next]] = [ids[next], ids[index]]
    await onReorder(ids)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">管理分類</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              setBusy(true)
              setError(null)
              try {
                await onAdd(name)
                setName('')
              } catch (err) {
                setError(err instanceof Error ? err.message : '新增失敗')
              } finally {
                setBusy(false)
              }
            }}
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="新分類名稱"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              <Plus size={14} />
              新增
            </button>
          </form>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <ul className="max-h-72 space-y-1.5 overflow-y-auto">
            {categories.map((cat, index) => (
              <li
                key={cat.id}
                className="flex items-center gap-2 rounded-lg border border-slate-150 border-slate-200 px-2.5 py-2"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label="上移"
                    disabled={index === 0}
                    onClick={() => void move(index, -1)}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="下移"
                    disabled={index === categories.length - 1}
                    onClick={() => void move(index, 1)}
                    className="text-slate-300 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                {editingId === cat.id ? (
                  <form
                    className="flex flex-1 gap-1"
                    onSubmit={async (e) => {
                      e.preventDefault()
                      await onRename(cat.id, editName)
                      setEditingId(null)
                    }}
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded bg-teal-600 px-2 py-1 text-xs text-white"
                    >
                      存
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                      {cat.name}
                    </span>
                    <span className="text-xs tabular-nums text-slate-400">
                      {counts[cat.id] ?? 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(cat.id)
                        setEditName(cat.name)
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (
                          !confirm(
                            `刪除分類「${cat.name}」？條目會變成未分類。`,
                          )
                        )
                          return
                        await onDelete(cat.id)
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </li>
            ))}
            {categories.length === 0 && (
              <li className="py-6 text-center text-sm text-slate-400">
                尚無分類，請新增
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
