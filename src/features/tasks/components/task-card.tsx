'use client'

import { useState, useRef, useEffect } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Clock, MessageSquare, CheckSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import type { Task } from '../services/task-service'

const priorityColors = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
}

interface TaskCardProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  compact?: boolean
}

export function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done'
  const isDone = task.status === 'done' || task.status === 'archived'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  // Position menu via portal (no clipping)
  useEffect(() => {
    if (!menuOpen || !menuBtnRef.current) return
    const rect = menuBtnRef.current.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 }) // 176 = w-44
  }, [menuOpen])

  // Close on click outside
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
      onDoubleClick={() => onEdit(task)}
      className={cn(
        'group relative rounded-md border border-outline-variant/30 bg-surface px-3 py-2 transition-colors hover:border-primary/30 cursor-pointer',
        isDone && 'opacity-60'
      )}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id) }}
          className={cn(
            'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border-2 transition-colors',
            isDone ? 'border-success bg-success text-white' : 'border-outline hover:border-primary'
          )}
        >
          {isDone && (
            <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content — single compact row with overflow */}
        <div className="min-w-0 flex-1">
          {/* Title + priority */}
          <div className="flex items-center gap-1.5">
            <span className={cn('size-1.5 shrink-0 rounded-full', priorityColors[task.priority])} />
            <span className={cn('truncate text-sm font-medium leading-tight', isDone && 'line-through text-muted-foreground')}>
              {task.title}
            </span>
          </div>

          {/* Meta — compact single row */}
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {/* Date + time — left side, smaller font */}
            {task.dueDate && (
              <span className={cn('flex items-center gap-1 text-[10px]', isOverdue && 'text-destructive')}>
                <Clock className="size-2.5" />
                <span className="font-medium">{format(new Date(task.dueDate), 'd MMM yyyy', { locale: uk })}</span>
                {task.dueTime && <span className="opacity-50">{task.dueTime}</span>}
              </span>
            )}

            {/* Subtasks */}
            {task.subtaskCount > 0 && (
              <span className="flex items-center gap-0.5">
                <CheckSquare className="size-2.5" />
                {task.subtaskDoneCount}/{task.subtaskCount}
              </span>
            )}

            {/* Comments */}
            {task.commentCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="size-2.5" />
                {task.commentCount}
              </span>
            )}

            {/* Assignee — only if assigned */}
            {task.assignedTo && (
              <span className="ml-auto flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-px text-primary">
                <span className="text-[9px] font-bold">{task.assignedTo.firstName[0]}</span>
                {task.assignedTo.firstName}
              </span>
            )}
          </div>
        </div>

        {/* Three dots */}
        <button
          ref={menuBtnRef}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:bg-surface-container group-hover:opacity-100"
        >
          <MoreVertical className="size-3.5" />
        </button>
      </div>

      {/* Dropdown menu — rendered via portal to avoid clipping */}
      {menuOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-44 rounded-md border border-outline-variant/30 bg-surface-container py-1 shadow-xl"
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
