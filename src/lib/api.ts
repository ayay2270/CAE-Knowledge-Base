import { isSupabaseConfigured, supabase } from './supabase'
import type {
  Category,
  EntryInput,
  KnowledgeEntry,
  KnowledgeImage,
} from '../types'
import { STORAGE_BUCKET } from '../types'

function uid() {
  return crypto.randomUUID()
}

function nowIso() {
  return new Date().toISOString()
}

const HYPERMESH_ID = '11111111-1111-1111-1111-111111111111'
const LSDYNA_ID = '22222222-2222-2222-2222-222222222222'

const seedCategories: Category[] = [
  {
    id: HYPERMESH_ID,
    name: 'HyperMesh',
    sort_order: 1,
    created_at: nowIso(),
  },
  {
    id: LSDYNA_ID,
    name: 'LS-DYNA',
    sort_order: 2,
    created_at: nowIso(),
  },
]

const seedEntries: KnowledgeEntry[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: '小孔 Washer 網格外圈不規則',
    category_id: HYPERMESH_ID,
    symptom:
      '小孔 washer 外圈出現不規則三角／四邊形，局部長寬比與翹曲超標，影響後續接觸定義。',
    root_cause:
      '孔邊與 washer 間距過近，batchmesh 無法維持目標尺寸與圓周對稱；washer 層數不足。',
    solution:
      '提高 washer 層數（≥2），縮小目標尺寸至孔徑 1/6～1/8，啟用 circular pattern / washer bias，並在局部用 remesh 清理。',
    failed_attempts:
      '單純縮小全局 size、只開 quad-dominant 而未補 washer 層，問題仍存在。',
    tags: ['washer', '小孔', 'batchmesh', 'HyperMesh', '網格品質'],
    is_favorite: true,
    deleted_at: null,
    last_viewed_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    created_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400_000).toISOString(),
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: '幾何補面',
    category_id: HYPERMESH_ID,
    symptom:
      'CAD 匯入後出現破面、縫隙，無法產生封閉 mid-surface 或 solid map。',
    root_cause:
      'STEP/IGES 公差與特徵刪除造成面不連續；小倒角與薄壁被簡化後留下 gap。',
    solution:
      '使用 Geom > Quick Edit / Surface Edit 補面，統一 tolerance，必要時 rebuild edges 再 mid-surface。',
    failed_attempts: '直接 Ignore gaps 進入 mesh，後續接觸與厚度計算失真。',
    tags: ['補面', 'geometry', 'STEP', 'HyperMesh'],
    is_favorite: false,
    deleted_at: null,
    last_viewed_at: null,
    created_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 86400_000).toISOString(),
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'LS-DYNA 時間步長設定建議',
    category_id: LSDYNA_ID,
    symptom:
      '顯式分析時間步長過小導致 runtime 過長，或過大觸發負體積／不穩定。',
    root_cause:
      '最小單元特徵長度與材料波速決定臨界 dt；局部細網與剛性材料主導。',
    solution:
      '檢查 d3hsp 中最小 dt 單元，局部放寬 mesh；合理使用質量縮放（MSS）並監控質量增加比例；控制接觸罰參數。',
    failed_attempts: '盲目提高 TSSFAC、全面質量縮放導致能量比異常。',
    tags: ['timestep', 'MSS', 'LS-DYNA', '穩定性'],
    is_favorite: false,
    deleted_at: null,
    last_viewed_at: new Date(Date.now() - 86400_000).toISOString(),
    created_at: new Date(Date.now() - 8 * 86400_000).toISOString(),
    updated_at: new Date(Date.now() - 6 * 86400_000).toISOString(),
  },
]

type MemoryStore = {
  categories: Category[]
  entries: KnowledgeEntry[]
  images: KnowledgeImage[]
  blobs: Map<string, Blob>
}

function createMemoryStore(): MemoryStore {
  return {
    categories: structuredClone(seedCategories),
    entries: structuredClone(seedEntries),
    images: [],
    blobs: new Map(),
  }
}

let memory = createMemoryStore()

export function resetMemoryStore() {
  for (const img of memory.images) {
    if (img.url?.startsWith('blob:')) URL.revokeObjectURL(img.url)
  }
  memory = createMemoryStore()
}

export type SyncStatus = {
  mode: 'supabase' | 'demo'
  online: boolean
  lastSyncedAt: string | null
  message: string
}

export function getSyncStatus(): SyncStatus {
  if (isSupabaseConfigured) {
    return {
      mode: 'supabase',
      online: true,
      lastSyncedAt: nowIso(),
      message: '已同步至共用雲端',
    }
  }
  return {
    mode: 'demo',
    online: false,
    lastSyncedAt: null,
    message: '示範模式（尚未設定 Supabase）',
  }
}

async function resolveImageUrl(path: string): Promise<string> {
  if (!supabase) {
    const blob = memory.blobs.get(path)
    if (blob) return URL.createObjectURL(blob)
    return ''
  }
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function listCategories(): Promise<Category[]> {
  if (!supabase) {
    return [...memory.categories].sort((a, b) => a.sort_order - b.sort_order)
  }
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createCategory(name: string): Promise<Category> {
  const trimmed = name.trim()
  if (!trimmed) throw new Error('分類名稱不可為空')
  if (!supabase) {
    const max = memory.categories.reduce((m, c) => Math.max(m, c.sort_order), 0)
    const cat: Category = {
      id: uid(),
      name: trimmed,
      sort_order: max + 1,
      created_at: nowIso(),
    }
    memory.categories.push(cat)
    return cat
  }
  const { data: existing } = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
  const sort_order = (existing?.[0]?.sort_order ?? 0) + 1
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: trimmed, sort_order })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'sort_order'>>,
): Promise<Category> {
  if (!supabase) {
    const cat = memory.categories.find((c) => c.id === id)
    if (!cat) throw new Error('分類不存在')
    if (patch.name !== undefined) cat.name = patch.name.trim()
    if (patch.sort_order !== undefined) cat.sort_order = patch.sort_order
    return { ...cat }
  }
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id: string): Promise<void> {
  if (!supabase) {
    memory.categories = memory.categories.filter((c) => c.id !== id)
    for (const e of memory.entries) {
      if (e.category_id === id) e.category_id = null
    }
    return
  }
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  if (!supabase) {
    orderedIds.forEach((id, i) => {
      const cat = memory.categories.find((c) => c.id === id)
      if (cat) cat.sort_order = i + 1
    })
    return
  }
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase!.from('categories').update({ sort_order: i + 1 }).eq('id', id),
    ),
  )
}

export async function listEntries(): Promise<KnowledgeEntry[]> {
  if (!supabase) {
    return memory.entries.map((e) => ({ ...e, tags: [...e.tags] }))
  }
  const { data, error } = await supabase.from('knowledge_entries').select('*')
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    tags: row.tags ?? [],
  }))
}

export async function createEntry(input: EntryInput): Promise<KnowledgeEntry> {
  const payload = {
    title: input.title.trim(),
    category_id: input.category_id,
    symptom: input.symptom,
    root_cause: input.root_cause,
    solution: input.solution,
    failed_attempts: input.failed_attempts,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
  }
  if (!payload.title) throw new Error('標題不可為空')
  if (!supabase) {
    const entry: KnowledgeEntry = {
      id: uid(),
      ...payload,
      is_favorite: false,
      deleted_at: null,
      last_viewed_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    memory.entries.unshift(entry)
    return { ...entry, tags: [...entry.tags] }
  }
  const { data, error } = await supabase
    .from('knowledge_entries')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return { ...data, tags: data.tags ?? [] }
}

export async function updateEntry(
  id: string,
  input: EntryInput,
): Promise<KnowledgeEntry> {
  const payload = {
    title: input.title.trim(),
    category_id: input.category_id,
    symptom: input.symptom,
    root_cause: input.root_cause,
    solution: input.solution,
    failed_attempts: input.failed_attempts,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    updated_at: nowIso(),
  }
  if (!payload.title) throw new Error('標題不可為空')
  if (!supabase) {
    const entry = memory.entries.find((e) => e.id === id)
    if (!entry) throw new Error('條目不存在')
    Object.assign(entry, payload)
    return { ...entry, tags: [...entry.tags] }
  }
  const { data, error } = await supabase
    .from('knowledge_entries')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return { ...data, tags: data.tags ?? [] }
}

export async function softDeleteEntry(id: string): Promise<void> {
  if (!supabase) {
    const entry = memory.entries.find((e) => e.id === id)
    if (entry) entry.deleted_at = nowIso()
    return
  }
  const { error } = await supabase
    .from('knowledge_entries')
    .update({ deleted_at: nowIso() })
    .eq('id', id)
  if (error) throw error
}

export async function restoreEntry(id: string): Promise<void> {
  if (!supabase) {
    const entry = memory.entries.find((e) => e.id === id)
    if (entry) entry.deleted_at = null
    return
  }
  const { error } = await supabase
    .from('knowledge_entries')
    .update({ deleted_at: null })
    .eq('id', id)
  if (error) throw error
}

export async function permanentDeleteEntry(id: string): Promise<void> {
  const images = await listImages(id)
  await Promise.all(images.map((img) => deleteImage(img)))
  if (!supabase) {
    memory.entries = memory.entries.filter((e) => e.id !== id)
    memory.images = memory.images.filter((i) => i.entry_id !== id)
    return
  }
  const { error } = await supabase.from('knowledge_entries').delete().eq('id', id)
  if (error) throw error
}

export async function toggleFavorite(id: string, value: boolean): Promise<void> {
  if (!supabase) {
    const entry = memory.entries.find((e) => e.id === id)
    if (entry) entry.is_favorite = value
    return
  }
  const { error } = await supabase
    .from('knowledge_entries')
    .update({ is_favorite: value })
    .eq('id', id)
  if (error) throw error
}

export async function markViewed(id: string): Promise<void> {
  if (!supabase) {
    const entry = memory.entries.find((e) => e.id === id)
    if (entry) entry.last_viewed_at = nowIso()
    return
  }
  const { error } = await supabase
    .from('knowledge_entries')
    .update({ last_viewed_at: nowIso() })
    .eq('id', id)
  if (error) throw error
}

export async function listImages(entryId: string): Promise<KnowledgeImage[]> {
  if (!supabase) {
    const rows = memory.images
      .filter((i) => i.entry_id === entryId)
      .sort((a, b) => a.sort_order - b.sort_order)
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: row.url || (await resolveImageUrl(row.storage_path)),
      })),
    )
  }
  const { data, error } = await supabase
    .from('knowledge_images')
    .select('*')
    .eq('entry_id', entryId)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return Promise.all(
    (data ?? []).map(async (row) => ({
      ...row,
      url: await resolveImageUrl(row.storage_path),
    })),
  )
}

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export async function uploadImages(
  entryId: string,
  files: File[],
): Promise<KnowledgeImage[]> {
  const existing = await listImages(entryId)
  let nextOrder = existing.reduce((m, i) => Math.max(m, i.sort_order), -1) + 1
  const created: KnowledgeImage[] = []

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error(`不支援的格式：${file.name}（僅 jpg/jpeg/png/webp）`)
    }
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${entryId}/${uid()}.${ext}`

    if (!supabase) {
      memory.blobs.set(path, file)
      const url = URL.createObjectURL(file)
      const row: KnowledgeImage = {
        id: uid(),
        entry_id: entryId,
        storage_path: path,
        file_name: file.name,
        sort_order: nextOrder++,
        created_at: nowIso(),
        url,
      }
      memory.images.push(row)
      created.push({ ...row })
      continue
    }

    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false })
    if (upErr) throw upErr

    const { data, error } = await supabase
      .from('knowledge_images')
      .insert({
        entry_id: entryId,
        storage_path: path,
        file_name: file.name,
        sort_order: nextOrder++,
      })
      .select()
      .single()
    if (error) throw error
    created.push({
      ...data,
      url: await resolveImageUrl(data.storage_path),
    })
  }
  return created
}

export async function deleteImage(image: KnowledgeImage): Promise<void> {
  if (!supabase) {
    if (image.url?.startsWith('blob:')) URL.revokeObjectURL(image.url)
    memory.blobs.delete(image.storage_path)
    memory.images = memory.images.filter((i) => i.id !== image.id)
    return
  }
  await supabase.storage.from(STORAGE_BUCKET).remove([image.storage_path])
  const { error } = await supabase
    .from('knowledge_images')
    .delete()
    .eq('id', image.id)
  if (error) throw error
}

export async function reorderImages(
  entryId: string,
  orderedIds: string[],
): Promise<void> {
  if (!supabase) {
    orderedIds.forEach((id, i) => {
      const img = memory.images.find((x) => x.id === id && x.entry_id === entryId)
      if (img) img.sort_order = i
    })
    return
  }
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase!
        .from('knowledge_images')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('entry_id', entryId),
    ),
  )
}

export async function downloadBlob(url: string, fileName: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
}
