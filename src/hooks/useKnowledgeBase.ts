import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'
import type {
  Category,
  EntryInput,
  KnowledgeEntry,
  KnowledgeImage,
  SortMode,
  ViewMode,
} from '../types'
import { entryMatchesQuery } from '../lib/utils'

export function useKnowledgeBase() {
  const [categories, setCategories] = useState<Category[]>([])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [imagesByEntry, setImagesByEntry] = useState<Record<string, KnowledgeImage[]>>(
    {},
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sync, setSync] = useState(api.getSyncStatus())
  const [view, setView] = useState<ViewMode>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('newest')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [cats, ents] = await Promise.all([
        api.listCategories(),
        api.listEntries(),
      ])
      setCategories(cats)
      setEntries(ents)
      setSync({ ...api.getSyncStatus(), lastSyncedAt: new Date().toISOString() })
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const counts = useMemo(() => {
    const active = entries.filter((e) => !e.deleted_at)
    const byCat: Record<string, number> = {}
    for (const c of categories) byCat[c.id] = 0
    for (const e of active) {
      if (e.category_id) byCat[e.category_id] = (byCat[e.category_id] ?? 0) + 1
    }
    return {
      all: active.length,
      byCat,
      favorites: active.filter((e) => e.is_favorite).length,
      recent: active.filter((e) => e.last_viewed_at).length,
      trash: entries.filter((e) => e.deleted_at).length,
    }
  }, [entries, categories])

  const filtered = useMemo(() => {
    let list = [...entries]
    if (view === 'trash') {
      list = list.filter((e) => e.deleted_at)
    } else {
      list = list.filter((e) => !e.deleted_at)
      if (view === 'favorites') list = list.filter((e) => e.is_favorite)
      if (view === 'recent') {
        list = list.filter((e) => e.last_viewed_at)
      }
      if (view === 'category' && categoryFilter) {
        list = list.filter((e) => e.category_id === categoryFilter)
      }
    }
    list = list.filter((e) => entryMatchesQuery(e, search))
    list.sort((a, b) => {
      if (view === 'recent') {
        return (b.last_viewed_at ?? '').localeCompare(a.last_viewed_at ?? '')
      }
      if (sort === 'title') return a.title.localeCompare(b.title, 'zh-Hant')
      if (sort === 'oldest') return a.updated_at.localeCompare(b.updated_at)
      return b.updated_at.localeCompare(a.updated_at)
    })
    return list
  }, [entries, view, categoryFilter, search, sort])

  const selected = useMemo(
    () => entries.find((e) => e.id === selectedId) ?? null,
    [entries, selectedId],
  )

  useEffect(() => {
    if (selectedId && !filtered.some((e) => e.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null)
    } else if (!selectedId && filtered[0]) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const loadImages = useCallback(async (entryId: string) => {
    const imgs = await api.listImages(entryId)
    setImagesByEntry((prev) => ({ ...prev, [entryId]: imgs }))
    return imgs
  }, [])

  useEffect(() => {
    if (selectedId) void loadImages(selectedId)
  }, [selectedId, loadImages])

  const selectEntry = useCallback(
    async (id: string) => {
      setSelectedId(id)
      const entry = entries.find((e) => e.id === id)
      if (entry && !entry.deleted_at) {
        await api.markViewed(id)
        setEntries((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, last_viewed_at: new Date().toISOString() } : e,
          ),
        )
      }
    },
    [entries],
  )

  const createEntry = useCallback(async (input: EntryInput) => {
    const entry = await api.createEntry(input)
    setEntries((prev) => [entry, ...prev])
    setSelectedId(entry.id)
    setView('all')
    setCategoryFilter(null)
    return entry
  }, [])

  const updateEntry = useCallback(async (id: string, input: EntryInput) => {
    const entry = await api.updateEntry(id, input)
    setEntries((prev) => prev.map((e) => (e.id === id ? entry : e)))
    return entry
  }, [])

  const softDelete = useCallback(async (id: string) => {
    await api.softDeleteEntry(id)
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, deleted_at: new Date().toISOString() } : e,
      ),
    )
  }, [])

  const restore = useCallback(async (id: string) => {
    await api.restoreEntry(id)
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, deleted_at: null } : e)),
    )
  }, [])

  const purge = useCallback(async (id: string) => {
    await api.permanentDeleteEntry(id)
    setEntries((prev) => prev.filter((e) => e.id !== id))
    setImagesByEntry((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelectedId(null)
  }, [])

  const toggleFavorite = useCallback(async (id: string, value: boolean) => {
    await api.toggleFavorite(id, value)
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, is_favorite: value } : e)),
    )
  }, [])

  const addCategory = useCallback(async (name: string) => {
    const cat = await api.createCategory(name)
    setCategories((prev) => [...prev, cat].sort((a, b) => a.sort_order - b.sort_order))
    return cat
  }, [])

  const renameCategory = useCallback(async (id: string, name: string) => {
    const cat = await api.updateCategory(id, { name })
    setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)))
  }, [])

  const removeCategory = useCallback(async (id: string) => {
    await api.deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
    setEntries((prev) =>
      prev.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)),
    )
    if (categoryFilter === id) {
      setCategoryFilter(null)
      setView('all')
    }
  }, [categoryFilter])

  const reorderCats = useCallback(async (ids: string[]) => {
    await api.reorderCategories(ids)
    setCategories((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]))
      return ids
        .map((id, i) => {
          const c = map.get(id)
          return c ? { ...c, sort_order: i + 1 } : null
        })
        .filter(Boolean) as Category[]
    })
  }, [])

  const uploadImages = useCallback(
    async (entryId: string, files: File[]) => {
      const imgs = await api.uploadImages(entryId, files)
      setImagesByEntry((prev) => ({
        ...prev,
        [entryId]: [...(prev[entryId] ?? []), ...imgs].sort(
          (a, b) => a.sort_order - b.sort_order,
        ),
      }))
      return imgs
    },
    [],
  )

  const removeImage = useCallback(async (image: KnowledgeImage) => {
    await api.deleteImage(image)
    setImagesByEntry((prev) => ({
      ...prev,
      [image.entry_id]: (prev[image.entry_id] ?? []).filter((i) => i.id !== image.id),
    }))
  }, [])

  const reorderImages = useCallback(async (entryId: string, ids: string[]) => {
    await api.reorderImages(entryId, ids)
    setImagesByEntry((prev) => {
      const map = new Map((prev[entryId] ?? []).map((i) => [i.id, i]))
      return {
        ...prev,
        [entryId]: ids
          .map((id, i) => {
            const img = map.get(id)
            return img ? { ...img, sort_order: i } : null
          })
          .filter(Boolean) as KnowledgeImage[],
      }
    })
  }, [])

  return {
    categories,
    entries,
    filtered,
    selected,
    selectedId,
    imagesByEntry,
    loading,
    error,
    sync,
    view,
    setView,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    sort,
    setSort,
    counts,
    refresh,
    selectEntry,
    createEntry,
    updateEntry,
    softDelete,
    restore,
    purge,
    toggleFavorite,
    addCategory,
    renameCategory,
    removeCategory,
    reorderCats,
    uploadImages,
    removeImage,
    reorderImages,
    loadImages,
  }
}

export type KnowledgeBaseState = ReturnType<typeof useKnowledgeBase>
