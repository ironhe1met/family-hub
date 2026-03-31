'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  X, Pencil, Save, Trash2, User, Calendar, Flag,
  ListChecks, Plus, Check, MessageSquare, Send, MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { useTask } from '@/features/tasks/hooks/use-task'
import { taskListService, type TaskList } from '@/features/tasks/services/task-service'

const STATUS_LABELS: Record<string, string> = { new: 'Нова', in_progress: 'В роботі', done: 'Виконана', archived: 'Архів' }
const STATUS_COLORS: Record<string, string> = { new: 'bg-muted-foreground/20 text-muted-foreground', in_progress: 'bg-primary/20 text-primary', done: 'bg-success/20 text-success', archived: 'bg-outline/30 text-muted-foreground' }
const PRIORITY_LABELS: Record<string, string> = { high: 'Високий', medium: 'Середній', low: 'Низький' }
const PRIORITY_COLORS: Record<string, string> = { high: 'text-priority-high', medium: 'text-priority-medium', low: 'text-priority-low' }

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const {
    task, loading,
    updateTask, deleteTask, updateStatus,
    addSubtask, toggleSubtask, deleteSubtask,
    addComment, updateComment, deleteComment,
  } = useTask(id)
  const confirm = useConfirm()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [mobileTab, setMobileTab] = useState<'content' | 'info'>('content')

  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [members, setMembers] = useState<{ id: string; firstName: string }[]>([])

  const [showAddSubtask, setShowAddSubtask] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')
  const [newComment, setNewComment] = useState('')

  // Comment editing
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentText, setEditCommentText] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    taskListService.list().then((d) => setTaskLists(d.lists)).catch(() => {})
    fetch('/api/v1/family/members').then((r) => r.json()).then((d) => setMembers(d.members || [])).catch(() => {})
  }, [])

  if (task && !initialized) {
    setTitle(task.title)
    setDescription(task.description || '')
    setInitialized(true)
  }

  useEffect(() => {
    const el = textareaRef.current
    if (el && editing) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [description, editing])

  const handleSave = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    try { await updateTask({ title: title.trim(), description: description.trim() || undefined }); setEditing(false) }
    catch { /* keep */ }
    finally { setSaving(false) }
  }, [title, description, updateTask])

  const handleDelete = useCallback(async () => {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити задачу?' })) return
    await deleteTask(); router.push('/tasks')
  }, [deleteTask, router])

  const handleAddSubtask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); if (!newSubtask.trim()) return
    await addSubtask(newSubtask.trim()); setNewSubtask(''); setShowAddSubtask(false)
  }, [newSubtask, addSubtask])

  const handleAddComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault(); if (!newComment.trim()) return
    await addComment(newComment.trim()); setNewComment('')
  }, [newComment, addComment])

  const handleSaveComment = useCallback(async () => {
    if (!editingCommentId || !editCommentText.trim()) return
    await updateComment(editingCommentId, editCommentText.trim())
    setEditingCommentId(null); setEditCommentText('')
  }, [editingCommentId, editCommentText, updateComment])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити коментар?' })) return
    await deleteComment(commentId)
  }, [deleteComment])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  }
  if (!task) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Задачу не знайдено</div>
  }

  // ── Properties sidebar ──
  const propertiesContent = (
    <div className="space-y-5">
      <PropertySection label="Статус">
        <div className="flex flex-wrap gap-1">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateStatus(key)}
              className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors', task.status === key ? STATUS_COLORS[key] : 'text-muted-foreground/50 hover:text-muted-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </PropertySection>

      <PropertySection label="Пріоритет">
        <div className="flex gap-1">
          {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateTask({ priority: key as 'high' | 'medium' | 'low' })}
              className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors', task.priority === key ? PRIORITY_COLORS[key] : 'text-muted-foreground/50 hover:text-muted-foreground')}>
              <Flag className={cn('mr-1 inline size-3', task.priority === key && PRIORITY_COLORS[key])} />{label}
            </button>
          ))}
        </div>
      </PropertySection>

      <PropertySection label="Виконавець" icon={<User className="size-3.5" />}>
        <select value={task.assignedTo?.id || ''} onChange={(e) => updateTask({ assignedTo: e.target.value || null } )}
          className="w-full rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground">
          <option value="">Не призначено</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.firstName}</option>)}
        </select>
      </PropertySection>

      <PropertySection label="Дедлайн" icon={<Calendar className="size-3.5" />}>
        <div className="flex gap-1">
          <input type="date" value={task.dueDate ? task.dueDate.slice(0, 10) : ''} onChange={(e) => updateTask({ dueDate: e.target.value || null } )}
            className="flex-1 rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground" />
          <input type="time" value={task.dueTime || ''} onChange={(e) => updateTask({ dueTime: e.target.value || null } )}
            className="w-20 rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground" />
        </div>
      </PropertySection>

      <PropertySection label="Список" icon={<ListChecks className="size-3.5" />}>
        <select value={task.listId || ''} onChange={(e) => updateTask({ listId: e.target.value || null } )}
          className="w-full rounded-md border border-outline/30 bg-surface-container px-2 py-1 text-xs text-foreground">
          <option value="">Без списку</option>
          {taskLists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </PropertySection>

      <div className="border-t border-outline-variant/20 pt-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Деталі</h3>
        <div className="space-y-2.5">
          <DetailRow icon={<User className="size-3.5" />} label="Автор" value={task.createdBy.firstName} />
          <DetailRow icon={<Calendar className="size-3.5" />} label="Створено" value={format(new Date(task.createdAt), 'd MMM yyyy', { locale: uk })} />
          {task.updatedAt !== task.createdAt && (
            <DetailRow icon={<Pencil className="size-3.5" />} label="Оновлено" value={format(new Date(task.updatedAt), 'd MMM yyyy', { locale: uk })} />
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/20 pt-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Дії</h3>
        <div className="space-y-0.5">
          {editing ? (
            <>
              <ActionBtn icon={<Pencil className="size-4 text-muted-foreground" />} label="Перегляд" onClick={() => setEditing(false)} />
              <ActionBtn icon={<Save className="size-4" />} label={saving ? 'Збереження...' : 'Зберегти'} onClick={handleSave} className="text-primary hover:bg-primary/10" />
            </>
          ) : (
            <ActionBtn icon={<Pencil className="size-4 text-muted-foreground" />} label="Редагувати" onClick={() => setEditing(true)} />
          )}
          <ActionBtn icon={<Trash2 className="size-4" />} label="Видалити" onClick={handleDelete} className="text-destructive hover:bg-destructive/10" />
          <div className="mt-2 border-t border-outline-variant/20 pt-2">
            <ActionBtn icon={<X className="size-4 text-muted-foreground" />} label="Закрити" onClick={() => router.push('/tasks')} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 flex flex-col bg-background">

      {/* Mobile tabs */}
      <div className="border-b border-outline-variant/20 lg:hidden">
        <div className="flex">
          <button onClick={() => setMobileTab('content')} className={cn('flex-1 py-2.5 text-center text-sm font-medium', mobileTab === 'content' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Вміст</button>
          <button onClick={() => setMobileTab('info')} className={cn('flex-1 py-2.5 text-center text-sm font-medium', mobileTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Інфо</button>
        </div>
      </div>

      {mobileTab === 'info' && <div className="flex-1 overflow-y-auto p-4 lg:hidden">{propertiesContent}</div>}

      {/* Desktop: 2-column */}
      <div className={cn('flex min-h-0 flex-1', mobileTab === 'info' && 'hidden lg:flex')}>

        {/* Center */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Назва задачі"
                className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            ) : (
              <div className="mb-4 flex items-start gap-3">
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                <span className={cn('mt-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium', STATUS_COLORS[task.status])}>{STATUS_LABELS[task.status]}</span>
              </div>
            )}

            {/* ── Subtasks ── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Підзадачі</h2>
                  {task.subtaskCount > 0 && <span className="text-xs text-muted-foreground">{task.subtaskDoneCount}/{task.subtaskCount}</span>}
                </div>
                <button onClick={() => setShowAddSubtask(!showAddSubtask)}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground">
                  <Plus className="size-3.5" /> Крок
                </button>
              </div>

              {/* Add subtask form (top) */}
              {showAddSubtask && (
                <form onSubmit={handleAddSubtask} className="mb-3 flex items-center gap-2 rounded-md bg-surface-container/50 px-2 py-2">
                  <input value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} placeholder="Назва кроку" autoFocus
                    className="h-7 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  <button type="submit" disabled={!newSubtask.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-on-primary disabled:opacity-30">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowAddSubtask(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
                </form>
              )}

              {task.subtaskCount > 0 && (
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-success transition-all" style={{ width: `${(task.subtaskDoneCount / task.subtaskCount) * 100}%` }} />
                </div>
              )}
              <div className="space-y-0.5">
                {task.subtasks.map((s) => (
                  <div key={s.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-container/50">
                    <button onClick={() => toggleSubtask(s.id)} className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border-2', s.isDone ? 'border-success bg-success text-white' : 'border-outline hover:border-primary')}>
                      {s.isDone && <Check className="size-3" />}
                    </button>
                    <span className={cn('flex-1 text-sm', s.isDone && 'text-muted-foreground line-through')}>{s.title}</span>
                    <button onClick={() => deleteSubtask(s.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><X className="size-3.5" /></button>
                  </div>
                ))}
              </div>
            </section>

            <div className="my-6 border-t border-outline-variant/15" />

            {/* ── Description ── */}
            <section>
              {editing ? (
                <textarea ref={textareaRef} value={description}
                  onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                  placeholder="Опис задачі... (підтримується Markdown)"
                  className="min-h-[200px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
              ) : (
                <MarkdownRenderer content={description} />
              )}
            </section>

            <div className="my-6 border-t border-outline-variant/15" />

            {/* ── Comments ── */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Коментарі</h2>
                {task.commentCount > 0 && <span className="text-xs text-muted-foreground">{task.commentCount}</span>}
              </div>

              <div className="space-y-3">
                {task.comments.map((c) => (
                  <div key={c.id} className="group rounded-md bg-surface-container/50 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{c.user.firstName}</span>
                        <span>{format(new Date(c.createdAt), 'd MMM, HH:mm', { locale: uk })}</span>
                      </div>
                      {/* Edit / Delete */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                        <button onClick={() => { setEditingCommentId(c.id); setEditCommentText(c.content) }}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-surface-container-high hover:text-foreground">
                          <Pencil className="size-3" />
                        </button>
                        <button onClick={() => handleDeleteComment(c.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>

                    {editingCommentId === c.id ? (
                      <div className="mt-1 flex gap-2">
                        <input value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveComment(); if (e.key === 'Escape') setEditingCommentId(null) }}
                          className="h-8 flex-1 rounded-md border border-primary bg-surface-container px-2 text-sm focus:outline-none" />
                        <button onClick={handleSaveComment} className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary"><Check className="size-3.5" /></button>
                        <button onClick={() => setEditingCommentId(null)} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container"><X className="size-3.5" /></button>
                      </div>
                    ) : (
                      <div className="text-sm text-foreground"><MarkdownRenderer content={c.content} /></div>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="mt-3 flex gap-2">
                <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Написати коментар..."
                  className="h-9 flex-1 rounded-md border border-outline/30 bg-surface-container px-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none" />
                <button type="submit" disabled={!newComment.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary disabled:opacity-30">
                  <Send className="size-4" />
                </button>
              </form>
            </section>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="p-5">{propertiesContent}</div>
        </aside>
      </div>

      {/* Mobile save */}
      {editing && mobileTab === 'content' && (
        <div className="border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50">
            {saving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      )}
    </div>
  )
}

function PropertySection({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">{icon}{label}</div>
      {children}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground/50">{icon}</span>
      <span className="shrink-0 text-muted-foreground/60">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container', className)}>
      <span className="shrink-0">{icon}</span>{label}
    </button>
  )
}
