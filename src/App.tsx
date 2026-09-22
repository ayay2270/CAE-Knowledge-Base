import { useEffect, useState } from 'react'
import { useKnowledgeBase } from './hooks/useKnowledgeBase'
import { Sidebar, MobileTopBar } from './components/Sidebar'
import { EntryList } from './components/EntryList'
import { EntryDetail } from './components/EntryDetail'
import { EntryFormDrawer } from './components/EntryFormDrawer'
import { CategoryManager } from './components/CategoryManager'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const kb = useKnowledgeBase()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [mobileDetail, setMobileDetail] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder*="搜尋"]',
        )
        input?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      {!isSupabaseConfigured && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900">
          目前為<strong className="mx-1">示範模式</strong>
          （記憶體資料，重整後重置）。請複製{' '}
          <code className="rounded bg-amber-100 px-1">.env.example</code> 為{' '}
          <code className="rounded bg-amber-100 px-1">.env</code>，填入
          Supabase URL／anon key，並執行{' '}
          <code className="rounded bg-amber-100 px-1">
            supabase/migrations/20260322000000_initial.sql
          </code>{' '}
          後重啟。
        </div>
      )}

      <MobileTopBar
        onMenu={() => setSidebarOpen(true)}
        title="CAE Knowledge Base"
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          kb={kb}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onAddEntry={() => {
            setEditing(false)
            setFormOpen(true)
          }}
          onManageCategories={() => setCatOpen(true)}
        />

        <main className="flex min-h-0 min-w-0 flex-1">
          {kb.error && (
            <div className="absolute inset-x-0 top-12 z-20 mx-auto max-w-lg rounded-lg bg-red-50 px-4 py-2 text-center text-sm text-red-600 shadow">
              {kb.error}
              <button
                type="button"
                className="ml-2 underline"
                onClick={() => void kb.refresh()}
              >
                重試
              </button>
            </div>
          )}

          <EntryList
            kb={kb}
            mobileShowDetail={mobileDetail}
            onSelect={(id) => {
              void kb.selectEntry(id)
              setMobileDetail(true)
            }}
          />
          <EntryDetail
            kb={kb}
            mobileShowDetail={mobileDetail}
            onBack={() => setMobileDetail(false)}
            onEdit={() => {
              setEditing(true)
              setFormOpen(true)
            }}
          />
        </main>
      </div>

      <EntryFormDrawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        categories={kb.categories}
        initial={editing ? kb.selected : null}
        onSubmit={async (input) => {
          if (editing && kb.selected) {
            await kb.updateEntry(kb.selected.id, input)
          } else {
            await kb.createEntry(input)
            setMobileDetail(true)
          }
        }}
      />

      <CategoryManager
        open={catOpen}
        onClose={() => setCatOpen(false)}
        categories={kb.categories}
        counts={kb.counts.byCat}
        onAdd={async (name) => {
          await kb.addCategory(name)
        }}
        onRename={async (id, name) => {
          await kb.renameCategory(id, name)
        }}
        onDelete={async (id) => {
          await kb.removeCategory(id)
        }}
        onReorder={async (ids) => {
          await kb.reorderCats(ids)
        }}
      />
    </div>
  )
}
