'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Flag, User, Calendar, ListChecks, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { taskService, taskListService, type TaskList } from '@/features/tasks/services/task-service'

const PRIORITY_LABELS: Record<string, string> = { high: 'Високий', medium: 'Середній', low: 'Низький' }
const PRIORITY_COLORS: Record<string, string> = { high: 'text-priority-high', medium: 'text-priority-medium', low: 'text-priority-low' }

export default function NewTaskPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [listId, setListId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [saving, setSaving] = useState(false)

  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [members, setMembers] = useState<{ id: string; firstName: string }[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    taskListService.list().then((d) => setTaskLists(d.lists)).catch(() => {})
    fetch('/api/v1/family/members').then((r) => r.json()).then((d) => setMembers(d.members || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [description])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { task } = await taskService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        listId: listId || undefined,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
      })
      router.push(`/tasks/${task.id}`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="-mx-4 -mt-6 -mb-24">
      <div className="lg:flex min-h-[calc(100vh-var(--header-height))]">

        {/* Center: content */}
        <div className="min-w-0 flex-1">
          <div className="px-6 py-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              placeholder="Назва задачі"
              className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              placeholder="Опис задачі... (підтримується Markdown)"
              className="min-h-[300px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Right: properties */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="space-y-5 p-5">

            {/* Priority */}
            <PropertySection label="Пріоритет">
              <div className="flex gap-1">
                {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => setPriority(key as 'high' | 'medium' | 'low')}
                    className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', priority === key ? PRIORITY_COLORS[key] : 'text-muted-foreground/50 hover:text-muted-foreground')}>
                    <Flag className={cn('mr-1 inline size-3', priority === key && PRIORITY_COLORS[key])} />{label}
                  </button>
                ))}
              </div>
            </PropertySection>

            {/* Assignee */}
            <PropertySection label="Виконавець" icon={<User className="size-3.5" />}>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground">
                <option value="">Не призначено</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.firstName}</option>)}
              </select>
            </PropertySection>

            {/* Due date */}
            <PropertySection label="Дедлайн" icon={<Calendar className="size-3.5" />}>
              <div className="flex gap-1">
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground" />
                <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)}
                  className="w-20 rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground" />
              </div>
            </PropertySection>

            {/* List */}
            <PropertySection label="Список" icon={<ListChecks className="size-3.5" />}>
              <select value={listId} onChange={(e) => setListId(e.target.value)}
                className="w-full rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground">
                <option value="">Без списку</option>
                {taskLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </PropertySection>

            {/* Actions */}
            <div className="border-t border-outline-variant/20 pt-4">
              <div className="space-y-0.5">
                <button onClick={handleSave} disabled={!title.trim() || saving}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50">
                  {saving ? 'Створення...' : 'Створити задачу'}
                </button>
                <div className="mt-2 border-t border-outline-variant/20 pt-2">
                  <button onClick={() => router.push('/tasks')}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container">
                    <X className="size-4 text-muted-foreground" /> Закрити
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile: save button */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
        <button onClick={handleSave} disabled={!title.trim() || saving}
          className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50">
          {saving ? 'Створення...' : 'Створити задачу'}
        </button>
      </div>
    </div>
  )
}

function PropertySection({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {icon}{label}
      </div>
      {children}
    </div>
  )
}
