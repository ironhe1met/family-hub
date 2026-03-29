'use client'

import { useState, useRef, useEffect } from 'react'
import { format, isPast, isToday, isTomorrow } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Clock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { Task } from '../services/task-service'

const priorityBorder = {
  high: 'border-l-priority-high',
  medium: 'border-l-priority-medium',
  low: 'border-l-priority-low',
}

function getDateColor(dueDate: string, status: string) {
  if (status === 'done' || status === 'archived') return 'text-muted-foreground/70'
  const date = new Date(dueDate)
  if (isPast(date) && !isToday(date)) return 'text-destructive'
  if (isToday(date)) return 'text-warning'
  if (isTomorrow(date)) return 'text-warning/70'
  return 'text-success/70'
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  compact?: boolean
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const isDone = task.status === 'done' || task.status === 'archived'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    if (!menuOpen || !menuBtnRef.current) return
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 })
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

  const dateColor = task.dueDate ? getDateColor(task.dueDate, task.status) : ''

  return (
    <div
      onDoubleClick={() => onEdit(task)}
      className={cn(
        'group rounded-md border border-outline-variant/20 border-l-[3px] bg-surface transition-colors hover:bg-surface-container/50 cursor-pointer',
        priorityBorder[task.priority],
        isDone && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
          className={cn(
            'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-2 transition-colors',
            isDone ? 'border-success bg-success text-white' : 'border-outline/50 hover:border-primary'
          )}
        >
          {isDone && (
            <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <span className={cn('text-[13px] font-medium leading-snug', isDone && 'line-through text-muted-foreground')}>
            {task.title}
          </span>

          {/* Date + time */}
          {task.dueDate && (
            <div className={cn('mt-1.5 flex items-center gap-1 text-[10px]', dateColor)}>
              <Clock className="size-2.5" />
              <span className="font-medium">{format(new Date(task.dueDate), 'd MMM yyyy', { locale: uk })}</span>
              {task.dueTime && <span className="opacity-50">{task.dueTime}</span>}
            </div>
          )}
        </div>

        {/* Three dots */}
        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/30 transition-colors hover:bg-surface-container hover:text-muted-foreground"
        >
          <MoreVertical className="size-4" />
        </button>
      </div>

      {/* Dropdown via portal */}
      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-44 rounded-lg border border-outline-variant/30 bg-surface-container py-1 shadow-2xl"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit(task) }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-surface-container-high"
          >
            <Pencil className="size-4 text-muted-foreground" />
            Редагувати
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(task.id) }}
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
