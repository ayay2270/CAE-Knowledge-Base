import { useCallback, useRef, useState } from 'react'
import {
  Download,
  Expand,
  Trash2,
  Upload,
  GripVertical,
} from 'lucide-react'
import type { KnowledgeImage } from '../types'
import { downloadBlob } from '../lib/api'
import { Lightbox } from './Lightbox'

type Props = {
  entryId: string
  images: KnowledgeImage[]
  onUpload: (files: File[]) => Promise<unknown>
  onDelete: (image: KnowledgeImage) => Promise<void>
  onReorder: (orderedIds: string[]) => Promise<void>
}

export function ImageGallery({
  images,
  onUpload,
  onDelete,
  onReorder,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragId = useRef<string | null>(null)

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list)
      if (!files.length) return
      setBusy(true)
      setError(null)
      try {
        await onUpload(files)
      } catch (e) {
        setError(e instanceof Error ? e.message : '上傳失敗')
      } finally {
        setBusy(false)
      }
    },
    [onUpload],
  )

  const downloadAll = async () => {
    for (const img of images) {
      if (img.url) await downloadBlob(img.url, img.file_name)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          圖片 ({images.length})
        </h3>
        <div className="flex items-center gap-2">
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => void downloadAll()}
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
            >
              <Download size={12} />
              全部下載
            </button>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            <Upload size={12} />
            上傳
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files)
        }}
        className={`mb-3 rounded-lg border border-dashed px-3 py-4 text-center text-xs transition ${
          dragOver
            ? 'border-teal-400 bg-teal-50 text-teal-700'
            : 'border-slate-200 bg-slate-50 text-slate-400'
        }`}
      >
        拖放圖片至此，或點「上傳」（jpg / jpeg / png / webp，可多選）
      </div>

      {error && (
        <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <p className="text-xs text-slate-400">尚無圖片</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, index) => (
            <li
              key={img.id}
              draggable
              onDragStart={() => {
                dragId.current = img.id
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = dragId.current
                dragId.current = null
                if (!from || from === img.id) return
                const ids = images.map((i) => i.id)
                const fromIdx = ids.indexOf(from)
                const toIdx = ids.indexOf(img.id)
                if (fromIdx < 0 || toIdx < 0) return
                ids.splice(fromIdx, 1)
                ids.splice(toIdx, 0, from)
                void onReorder(ids)
              }}
              className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
            >
              <button
                type="button"
                className="block w-full"
                onClick={() => setLightboxIndex(index)}
              >
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {img.url ? (
                    <img
                      src={img.url}
                      alt={img.file_name}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      無預覽
                    </div>
                  )}
                </div>
              </button>
              <div className="flex items-center gap-1 border-t border-slate-100 px-2 py-1.5">
                <GripVertical size={12} className="shrink-0 text-slate-300" />
                <span className="min-w-0 flex-1 truncate text-[10px] text-slate-500">
                  {img.file_name}
                </span>
                <button
                  type="button"
                  title="放大"
                  onClick={() => setLightboxIndex(index)}
                  className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-teal-600"
                >
                  <Expand size={12} />
                </button>
                <button
                  type="button"
                  title="下載"
                  onClick={() => img.url && void downloadBlob(img.url, img.file_name)}
                  className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-teal-600"
                >
                  <Download size={12} />
                </button>
                <button
                  type="button"
                  title="刪除"
                  onClick={async () => {
                    if (!confirm(`刪除 ${img.file_name}？`)) return
                    await onDelete(img)
                  }}
                  className="rounded p-0.5 text-slate-400 hover:bg-white hover:text-red-500"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  )
}
