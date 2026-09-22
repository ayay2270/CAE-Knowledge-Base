import { useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import type { KnowledgeImage } from '../types'
import { downloadBlob } from '../lib/api'

type Props = {
  images: KnowledgeImage[]
  index: number
  onClose: () => void
  onIndexChange: (i: number) => void
}

export function Lightbox({ images, index, onClose, onIndexChange }: Props) {
  const img = images[index]
  const hasPrev = index > 0
  const hasNext = index < images.length - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onIndexChange(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onIndexChange(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hasPrev, hasNext, index, onClose, onIndexChange])

  if (!img) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 text-white">
        <div className="min-w-0 truncate text-sm">
          {img.file_name}{' '}
          <span className="text-white/50">
            ({index + 1}/{images.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10"
            title="下載"
            onClick={() => img.url && void downloadBlob(img.url, img.file_name)}
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            className="rounded-lg p-2 hover:bg-white/10"
            title="關閉"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-12 pb-8">
        {hasPrev && (
          <button
            type="button"
            className="absolute left-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndexChange(index - 1)}
            aria-label="上一張"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {img.url ? (
          <img
            src={img.url}
            alt={img.file_name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-white/60">無法載入圖片</div>
        )}
        {hasNext && (
          <button
            type="button"
            className="absolute right-2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => onIndexChange(index + 1)}
            aria-label="下一張"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  )
}
