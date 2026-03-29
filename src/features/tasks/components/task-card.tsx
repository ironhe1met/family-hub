'use client'

import { format, isPast, isToday } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Calendar, MessageSquare, CheckSquare, Pencil, Trash2 } from 'lucide-react'
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

export function TaskCard({ task, onToggle, onEdit, onDelete, compact }: TaskCardProps) {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate)) && task.status !== 'done'
  const isDone = task.status === 'done' || task.status === 'archived'

  return (
    <div
      onDoubleClick={() => onEdit(task)}
      className={cn(
        'group rounded-md border border-outline-variant/30 bg-surface px-3 py-2.5 transition-colors hover:border-primary/30 cursor-pointer',
        isDone && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 transition-colors',
            isDone ? 'border-success bg-success text-white' : 'border-outline hover:border-primary'
          )}
        >
          {isDone && (
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* Priority dot */}
            <span className={cn('size-2 shrink-0 rounded-full', priorityColors[task.priority])} />
            {/* Title */}
            <span className={cn('text-sm font-medium', isDone && 'line-through text-muted-foreground')}>
              {task.title}
            </span>
          </div>

          {/* Meta row */}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {/* Due date */}
            {task.dueDate && (
              <span className={cn('flex items-center gap-1', isOverdue && 'text-destructive font-medium')}>
                <Calendar className="size-3" />
                {format(new Date(task.dueDate), 'd MMM', { locale: uk })}
                {task.dueTime && ` ${task.dueTime}`}
              </span>
            )}

            {/* Subtask progress */}
            {task.subtaskCount > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="size-3" />
                {task.subtaskDoneCount}/{task.subtaskCount}
              </span>
            )}

            {/* Comment count */}
            {task.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="size-3" />
                {task.commentCount}
              </span>
            )}

            {/* Assignee */}
            {task.assignedTo ? (
              <span className="flex items-center gap-1">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                  {task.assignedTo.firstName[0]}
                </span>
                <span>{task.assignedTo.firstName}</span>
              </span>
            ) : (
              <span className="italic opacity-50">Не призначена</span>
            )}
          </div>

          {/* Tags */}
          {!compact && task.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color || undefined }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => onEdit(task)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container">
            <Pencil className="size-3.5" />
          </button>
          <button onClick={() => onDelete(task.id)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
