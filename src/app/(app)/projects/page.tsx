'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FolderKanban, Search, Trash2, MoreVertical, Pencil } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { ProjectListItem } from '@/features/projects/services/project-service'

const STATUS_LABELS: Record<string, string> = { active: 'Активний', paused: 'Пауза', completed: 'Завершений' }
const STATUS_COLORS: Record<string, string> = { active: 'bg-primary/20 text-primary', paused: 'bg-warning/20 text-warning', completed: 'bg-success/20 text-success' }

export default function ProjectsPage() {
  const router = useRouter()
  const { projects, loading, deleteProject } = useProjects()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  let filtered = projects
  if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter)
  if (search) filtered = filtered.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-surface-container" />
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-md bg-surface-container/30" />)}</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Проєкти</h1>
        {projects.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук..."
              className="h-9 w-48 rounded-md border border-outline/30 bg-surface-container pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
          </div>
        )}
      </div>

      {projects.length > 0 && (
        <div className="mb-4 flex gap-1">
          <button onClick={() => setStatusFilter('')} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', !statusFilter ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>Всі</button>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)} className={cn('rounded-md px-3 py-1.5 text-sm font-medium', statusFilter === key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>{label}</button>
          ))}
        </div>
      )}

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FolderKanban className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Проєктів поки немає</h2>
          <p className="mt-1 text-sm text-muted-foreground">Створіть перший проєкт</p>
          <button onClick={() => router.push('/projects/new')} className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90">Створити проєкт</button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="space-y-1">
          {filtered.map((p) => (
            <ProjectRow key={p.id} project={p}
              onClick={() => router.push(`/projects/${p.id}`)}
              onEdit={() => router.push(`/projects/${p.id}`)}
              onDelete={async () => { if (await confirm({ message: 'Ви впевнені, що хочете видалити проєкт?' })) deleteProject(p.id) }}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && projects.length > 0 && <div className="py-12 text-center text-sm text-muted-foreground">Нічого не знайдено</div>}

      <button onClick={() => router.push('/projects/new')}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </button>
    </div>
  )
}

function ProjectRow({ project: p, onClick, onEdit, onDelete }: {
  project: ProjectListItem; onClick: () => void; onEdit: () => void; onDelete: () => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  // Combined progress: items + tasks
  const totalAll = p.itemCount + p.taskCount
  const doneAll = p.itemDoneCount + p.taskDoneCount
  const progress = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0

  useEffect(() => {
    if (!menuOpen || !menuBtnRef.current) return
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 160 })
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
    <div onClick={onClick}
      className="group flex cursor-pointer items-center gap-4 rounded-md border border-outline-variant/20 bg-surface px-4 py-3 transition-colors hover:bg-surface-container/50">
      {/* Progress circle */}
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <svg className="size-10 -rotate-90">
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-surface-container)" strokeWidth="3" />
          <circle cx="20" cy="20" r="16" fill="none" stroke="var(--color-primary)" strokeWidth="3"
            strokeDasharray={`${progress * 1.005} 100.5`} strokeLinecap="round" />
        </svg>
        <span className="absolute text-[9px] font-bold text-muted-foreground">{progress}%</span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{p.title}</h3>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[p.status])}>{STATUS_LABELS[p.status]}</span>
        </div>
        {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
      </div>

      {/* Stats */}
      <div className="hidden shrink-0 items-center gap-6 text-xs text-muted-foreground sm:flex">
        <span>{doneAll}/{totalAll} елементів</span>
        {p.totalCost > 0 && <span className="font-medium text-foreground">₴{p.totalCost.toLocaleString()}</span>}
      </div>

      {/* 3-dot menu */}
      <button ref={menuBtnRef} onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground/30 transition-colors hover:bg-surface-container hover:text-muted-foreground">
        <MoreVertical className="size-4" />
      </button>

      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div ref={menuRef}
          className="fixed z-50 min-w-[140px] rounded-lg border border-outline-variant/30 bg-surface-container py-1 shadow-2xl"
          style={{ top: menuPos.top, left: menuPos.left }}>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-foreground hover:bg-surface-container-high">
            <Pencil className="size-3.5 text-muted-foreground" /> Відкрити
          </button>
          <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete() }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10">
            <Trash2 className="size-3.5" /> Видалити
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}
