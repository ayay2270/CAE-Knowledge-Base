export type Category = {
  id: string
  name: string
  sort_order: number
  created_at: string
}

export type KnowledgeEntry = {
  id: string
  title: string
  category_id: string | null
  symptom: string
  root_cause: string
  solution: string
  failed_attempts: string
  tags: string[]
  is_favorite: boolean
  deleted_at: string | null
  last_viewed_at: string | null
  created_at: string
  updated_at: string
}

export type KnowledgeImage = {
  id: string
  entry_id: string
  storage_path: string
  file_name: string
  sort_order: number
  created_at: string
  /** Resolved public/signed URL for display (not stored in DB). */
  url?: string
}

export type KnowledgeEntryWithMeta = KnowledgeEntry & {
  category?: Category | null
  images?: KnowledgeImage[]
}

export type EntryInput = {
  title: string
  category_id: string | null
  symptom: string
  root_cause: string
  solution: string
  failed_attempts: string
  tags: string[]
}

export type ViewMode = 'all' | 'category' | 'favorites' | 'recent' | 'trash'

export type SortMode = 'newest' | 'oldest' | 'title'

export const STORAGE_BUCKET = 'knowledge-images'
