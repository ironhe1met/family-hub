'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Search, MoreVertical, Pencil, Trash2, ListChecks, FolderKanban } from 'lucide-react'
import { createPortal } from 'react-dom'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { useIdeas } from '@/features/ideas/hooks/use-ideas'
import type { Idea } from '@/features/ideas/services/idea-service'

export default function IdeasPage() {
  const router = useRouter()
  const { ideas, loading, deleteIdea, convertIdea } = useIdeas()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')

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
            onClick={() => router.push('/ideas/new')}
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
              onClick={() => router.push(`/ideas/${idea.id}`)}
              onDelete={async () => { if (await confirm({ message: 'Ви впевнені, що хочете видалити ідею?' })) deleteIdea(idea.id) }}
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
        onClick={() => router.push('/ideas/new')}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90"
      >
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}

// ==========================================
// Idea Card
// ==========================================

function IdeaCard({ idea, onClick, onDelete, onConvert }: {
  idea: Idea
  onClick: () => void
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
      onClick={onClick}
      className={cn(
        'group cursor-pointer rounded-md border border-outline-variant/20 bg-surface p-4 transition-colors hover:bg-surface-container/50',
        isConverted && 'opacity-60'
      )}
    >
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

      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/60">
        <span>{format(new Date(idea.createdAt), 'd MMM yyyy', { locale: uk })}</span>
        {isConverted && (
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
            → {idea.convertedToType === 'task' ? 'Задача' : 'Проєкт'}
          </span>
        )}
      </div>

      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] rounded-lg border border-outline-variant/30 bg-surface-container py-1 shadow-2xl"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onClick() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-container-high"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            Відкрити
          </button>
          {!isConverted && (
            <>
              <button
                onClick={async (e) => { e.stopPropagation(); setMenuOpen(false); await onConvert(idea.id, 'task') }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-container-high"
              >
                <ListChecks className="size-3.5 text-muted-foreground" />
                В задачу
              </button>
              <button
                onClick={async (e) => { e.stopPropagation(); setMenuOpen(false); await onConvert(idea.id, 'project') }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-container-high"
              >
                <FolderKanban className="size-3.5 text-muted-foreground" />
                В проєкт
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Видалити
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
