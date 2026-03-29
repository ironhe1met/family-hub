'use client'

import { useState, useEffect } from 'react'
import { X, Calendar as CalendarIcon, User, List, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskList } from '../services/task-service'

interface TaskFormDialogProps {
  task?: Task | null
  taskLists: TaskList[]
  familyMembers?: { id: string; firstName: string }[]
  onSave: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

const priorities = [
  { value: 'high' as const, label: 'Високий', color: 'border-priority-high text-priority-high' },
  { value: 'medium' as const, label: 'Середній', color: 'border-priority-medium text-priority-medium' },
  { value: 'low' as const, label: 'Низький', color: 'border-priority-low text-priority-low' },
]

const statuses = [
  { value: 'new' as const, label: 'Нова' },
  { value: 'in_progress' as const, label: 'В роботі' },
  { value: 'done' as const, label: 'Виконана' },
  { value: 'archived' as const, label: 'Архів' },
]

export function TaskFormDialog({ task, taskLists, familyMembers, onSave, onClose }: TaskFormDialogProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [priority, setPriority] = useState(task?.priority || 'medium')
  const [status, setStatus] = useState(task?.status || 'new')
  const [dueDate, setDueDate] = useState(task?.dueDate?.split('T')[0] || '')
  const [dueTime, setDueTime] = useState(task?.dueTime || '')
  const [listId, setListId] = useState(task?.listId || '')
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?.id || '')
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
      await onSave({
        title: title.trim(),
        description: description || null,
        priority,
        status,
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        listId: listId || null,
        assignedTo: assignedTo || null,
      })
      onClose()
    } catch {
      // keep dialog open on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-lg bg-surface-container p-6 shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Назва задачі"
            autoFocus
            className="h-12 w-full border-b-2 border-outline-variant/30 bg-transparent px-0 text-xl font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Опис (Markdown)"
            rows={3}
            className="w-full rounded-md border border-outline/30 bg-surface-container-high p-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
          />

          {/* List */}
          <div className="flex items-center gap-3">
            <List className="size-4 shrink-0 text-muted-foreground/50" />
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="h-10 flex-1 rounded-md border border-outline/30 bg-surface-container-high px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">Без списку</option>
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          {familyMembers && familyMembers.length > 1 && (
            <div className="flex items-center gap-3">
              <User className="size-4 shrink-0 text-muted-foreground/50" />
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="h-10 flex-1 rounded-md border border-outline/30 bg-surface-container-high px-3 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Загальна (всі)</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Due date + time */}
          <div className="flex items-center gap-3">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground/50" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-10 rounded-md border border-outline/30 bg-surface-container-high px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="h-10 rounded-md border border-outline/30 bg-surface-container-high px-3 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-3">
            <Flag className="size-4 shrink-0 text-muted-foreground/50" />
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value)}
                  className={cn(
                    'rounded-md border-2 px-3 py-1 text-xs font-medium transition-colors',
                    priority === p.value ? p.color : 'border-outline-variant/30 text-muted-foreground'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status (only on edit) */}
          {task && (
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                    status === s.value ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-muted-foreground'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:bg-surface-container-high">
              Скасувати
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Збереження...' : task ? 'Зберегти' : 'Створити'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
