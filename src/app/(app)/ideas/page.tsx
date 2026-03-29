'use client'

import { useState, useRef, useEffect } from 'react'
import { Lightbulb, Search, MoreVertical, Pencil, Trash2, ArrowRight, X, ListChecks, FolderKanban } from 'lucide-react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useIdeas } from '@/features/ideas/hooks/use-ideas'
import type { Idea } from '@/features/ideas/services/idea-service'

export default function IdeasPage() {
  const { ideas, loading, createIdea, updateIdea, deleteIdea, convertIdea } = useIdeas()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null)

  // Filter by search
  const filtered = search
    ? ideas.filter((i) =>
        i.title.toLowerCase().includes(search.toLowerCase()) ||
        i.description?.toLowerCase().includes(search.toLowerCase())
      )
    : ideas

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-surface-container" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-md bg-surface-container/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Ідеї</h1>

        {/* Search */}
        {ideas.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Пошук..."
              className="h-9 w-48 rounded-md border border-outline/30 bg-surface-container pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Empty state */}
      {ideas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Lightbulb className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Ідей поки немає</h2>
          <p className="mt-1 text-sm text-muted-foreground">Запишіть першу ідею</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90"
          >
            Записати ідею
          </button>
        </div>
      )}

      {/* Ideas grid */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onEdit={() => setEditingIdea(idea)}
              onDelete={() => { if (confirm('Видалити ідею?')) deleteIdea(idea.id) }}
              onConvert={convertIdea}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {filtered.length === 0 && ideas.length > 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Нічого не знайдено
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90"
      >
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Form dialog */}
      {(showForm || editingIdea) && (
        <IdeaFormDialog
          idea={editingIdea}
          onSave={async (data) => {
            if (editingIdea) {
              await updateIdea(editingIdea.id, data)
            } else {
              await createIdea(data)
            }
          }}
          onClose={() => { setShowForm(false); setEditingIdea(null) }}
        />
      )}
    </div>
  )
}

// ==========================================
// Idea Card
// ==========================================

function IdeaCard({ idea, onEdit, onDelete, onConvert }: {
  idea: Idea
  onEdit: () => void
  onDelete: () => void
  onConvert: (id: string, type: 'task' | 'project') => Promise<unknown>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const isConverted = !!idea.convertedToType

  useEffect(() => {
    if (!menuOpen || !menuBtnRef.current) return
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 200 })
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          menuBtnRef.current && !menuBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div
      onDoubleClick={onEdit}
      className={cn(
        'group rounded-md border border-outline-variant/20 bg-surface p-4 transition-colors hover:bg-surface-container/50 cursor-pointer',
        isConverted && 'opacity-60'
      )}
    >
      {/* Header: title + menu */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-foreground">{idea.title}</h3>
          {idea.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {idea.description}
            </p>
          )}
        </div>

        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/30 transition-colors hover:bg-surface-container hover:text-muted-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      </div>

      {/* Footer: date + converted badge */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>{format(new Date(idea.createdAt), 'd MMM yyyy', { locale: uk })}</span>
        {isConverted && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            → {idea.convertedToType === 'task' ? 'Задача' : 'Проєкт'}
          </span>
        )}
      </div>

      {/* Dropdown menu via portal */}
      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-[200px] rounded-lg border border-outline-variant/30 bg-surface-container py-1 shadow-2xl"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface-container-high"
          >
            <Pencil className="size-4 text-muted-foreground" />
            Редагувати
          </button>
          {!isConverted && (
            <>
              <button
                onClick={async (e) => { e.stopPropagation(); setMenuOpen(false); await onConvert(idea.id, 'task') }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface-container-high"
              >
                <ListChecks className="size-4 text-muted-foreground" />
                Конвертувати в задачу
              </button>
              <button
                onClick={async (e) => { e.stopPropagation(); setMenuOpen(false); await onConvert(idea.id, 'project') }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface-container-high"
              >
                <FolderKanban className="size-4 text-muted-foreground" />
                Конвертувати в проєкт
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-4" />
            Видалити
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

// ==========================================
// Idea Form Dialog
// ==========================================

function IdeaFormDialog({ idea, onSave, onClose }: {
  idea: Idea | null
  onSave: (data: { title: string; description?: string }) => Promise<void>
  onClose: () => void
}) {
  const [title, setTitle] = useState(idea?.title || '')
  const [description, setDescription] = useState(idea?.description || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSave({ title: title.trim(), description: description.trim() || undefined })
      onClose()
    } catch {
      // keep open
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-surface-container p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва ідеї"
            autoFocus
            className="h-12 w-full border-b-2 border-outline-variant/30 bg-transparent px-0 text-xl font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />

          <textarea
            ref={(el) => {
              if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 200) + 'px' }
            }}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
            }}
            placeholder="Опис (необов'язково)"
            rows={2}
            className="max-h-[200px] w-full resize-none overflow-y-auto rounded-md border border-outline/30 bg-surface-container-high p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:bg-surface-container-high">
              Скасувати
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Збереження...' : idea ? 'Зберегти' : 'Записати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
