export function highlightText(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text)
  const parts = query.trim().split(/\s+/).filter(Boolean)
  let result = escapeHtml(text)
  for (const part of parts) {
    const re = new RegExp(`(${escapeRegExp(escapeHtml(part))})`, 'gi')
    result = result.replace(re, '<mark class="search-hit">$1</mark>')
  }
  return result
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function entryMatchesQuery(
  entry: {
    title: string
    symptom: string
    root_cause: string
    solution: string
    failed_attempts: string
    tags: string[]
  },
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const hay = [
    entry.title,
    entry.symptom,
    entry.root_cause,
    entry.solution,
    entry.failed_attempts,
    entry.tags.join(' '),
  ]
    .join('\n')
    .toLowerCase()
  return q.split(/\s+/).every((token) => hay.includes(token))
}

export function snippet(text: string, max = 120) {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
