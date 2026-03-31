'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  X, Pencil, Save, Trash2, User, Calendar, FolderKanban,
  Plus, Check, ExternalLink, DollarSign, ListChecks, ChevronDown, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { useProject } from '@/features/projects/hooks/use-project'
import { taskService, type Task } from '@/features/tasks/services/task-service'

const PROJECT_STATUS_LABELS: Record<string, string> = { active: 'Активний', paused: 'Пауза', completed: 'Завершений' }
const PROJECT_STATUS_COLORS: Record<string, string> = { active: 'bg-primary/20 text-primary', paused: 'bg-warning/20 text-warning', completed: 'bg-success/20 text-success' }
const TASK_STATUS_LABELS: Record<string, string> = { new: 'Нові', in_progress: 'В роботі', done: 'Виконані', archived: 'Архів' }
const TASK_STATUS_DOT: Record<string, string> = { new: 'bg-muted-foreground/40', in_progress: 'bg-primary', done: 'bg-success', archived: 'bg-outline' }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { project, loading, updateProject, deleteProject, addItem, updateItem, deleteItem, addProjectTask, removeProjectTask } = useProject(id)
  const confirm = useConfirm()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [mobileTab, setMobileTab] = useState<'content' | 'info'>('content')

  // New item form
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemCost, setNewItemCost] = useState('')
  const [newItemUrl, setNewItemUrl] = useState('')

  // Edit item
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemTitle, setEditItemTitle] = useState('')
  const [editItemCost, setEditItemCost] = useState('')
  const [editItemUrl, setEditItemUrl] = useState('')

  // New task form
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [collapsedStatuses, setCollapsedStatuses] = useState<Record<string, boolean>>({ archived: true })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  if (project && !initialized) {
    setTitle(project.title)
    setDescription(project.description || '')
    setInitialized(true)
  }

  useEffect(() => {
    const el = textareaRef.current
    if (el && editing) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [description, editing])

  const handleSave = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    try { await updateProject({ title: title.trim(), description: description.trim() || undefined }); setEditing(false) }
    catch { /* keep */ }
    finally { setSaving(false) }
  }, [title, description, updateProject])

  const handleDelete = useCallback(async () => {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити проєкт?' })) return
    await deleteProject(); router.push('/projects')
  }, [deleteProject, router])

  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return
    await addItem({
      title: newItemTitle.trim(),
      estimatedCost: newItemCost ? parseFloat(newItemCost) : undefined,
      url: newItemUrl.trim() || undefined,
    })
    setNewItemTitle(''); setNewItemCost(''); setNewItemUrl(''); setShowAddItem(false)
  }, [newItemTitle, newItemCost, newItemUrl, addItem])

  const startEditItem = useCallback((item: { id: string; title: string; estimatedCost: number | null; url: string | null }) => {
    setEditingItemId(item.id)
    setEditItemTitle(item.title)
    setEditItemCost(item.estimatedCost != null ? String(item.estimatedCost) : '')
    setEditItemUrl(item.url || '')
  }, [])

  const saveEditItem = useCallback(async () => {
    if (!editingItemId || !editItemTitle.trim()) return
    await updateItem(editingItemId, {
      title: editItemTitle.trim(),
      estimatedCost: editItemCost ? parseFloat(editItemCost) : null,
      url: editItemUrl.trim() || null,
    })
    setEditingItemId(null)
  }, [editingItemId, editItemTitle, editItemCost, editItemUrl, updateItem])

  const handleAddTask = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    await addProjectTask(newTaskTitle.trim())
    setNewTaskTitle(''); setShowAddTask(false)
  }, [newTaskTitle, addProjectTask])

  const handleRemoveTask = useCallback(async (taskId: string) => {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити задачу?' })) return
    await removeProjectTask(taskId)
  }, [removeProjectTask])

  const toggleStatusGroup = (status: string) => {
    setCollapsedStatuses((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  const cycleItemStatus = useCallback(async (itemId: string, current: string) => {
    const next = current === 'pending' ? 'in_progress' : current === 'in_progress' ? 'done' : 'pending'
    await updateItem(itemId, { status: next })
  }, [updateItem])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  }
  if (!project) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Проєкт не знайдено</div>
  }

  const itemsDone = project.items.filter((i) => i.status === 'done').length
  const tasksDone = project.tasks.filter((t) => t.status === 'done').length
  const totalAll = project.items.length + project.tasks.length
  const doneAll = itemsDone + tasksDone
  const progress = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0

  const sidebarContent = (
    <div className="space-y-5">
      {/* Status */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Статус</div>
        <div className="flex gap-1">
          {Object.entries(PROJECT_STATUS_LABELS).map(([key, label]) => (
            <button key={key} onClick={() => updateProject({ status: key })}
              className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors', project.status === key ? PROJECT_STATUS_COLORS[key] : 'text-muted-foreground/50 hover:text-muted-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Бюджет</div>
        <div className="mb-2 text-lg font-semibold text-foreground">₴{project.completedCost.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">з ₴{project.totalCost.toLocaleString()}</span></div>
        {project.totalCost > 0 && (
          <div className="h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full rounded-full bg-success transition-all" style={{ width: `${project.totalCost > 0 ? (project.completedCost / project.totalCost) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Прогрес</div>
        <div className="mb-2 text-sm text-foreground">{doneAll}/{totalAll} ({progress}%)</div>
        <div className="mb-1 flex gap-3 text-[10px] text-muted-foreground">
          <span>{itemsDone}/{project.items.length} елем.</span>
          <span>{tasksDone}/{project.tasks.length} задач</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-container">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-outline-variant/20 pt-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Деталі</h3>
        <div className="space-y-2.5">
          <DetailRow icon={<User className="size-3.5" />} label="Автор" value={project.createdBy.firstName} />
          <DetailRow icon={<Calendar className="size-3.5" />} label="Створено" value={format(new Date(project.createdAt), 'd MMM yyyy', { locale: uk })} />
          {project.updatedAt !== project.createdAt && (
            <DetailRow icon={<Pencil className="size-3.5" />} label="Оновлено" value={format(new Date(project.updatedAt), 'd MMM yyyy', { locale: uk })} />
          )}
        </div>
      </div>

      {/* Actions */}
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
            <ActionBtn icon={<X className="size-4 text-muted-foreground" />} label="Закрити" onClick={() => router.push('/projects')} />
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

      {mobileTab === 'info' && <div className="flex-1 overflow-y-auto p-4 lg:hidden">{sidebarContent}</div>}

      <div className={cn('flex min-h-0 flex-1', mobileTab === 'info' && 'hidden lg:flex')}>
        {/* Center */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Назва проєкту"
                className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            ) : (
              <div className="mb-4 flex items-start gap-3">
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                <span className={cn('mt-2 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium', PROJECT_STATUS_COLORS[project.status])}>{PROJECT_STATUS_LABELS[project.status]}</span>
              </div>
            )}

            {/* ── Items ── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Елементи</h2>
                  <span className="text-xs text-muted-foreground">{itemsDone}/{project.items.length}</span>
                </div>
                <button onClick={() => setShowAddItem(!showAddItem)}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground">
                  <Plus className="size-3.5" /> Елемент
                </button>
              </div>

              {/* Add item form (top) */}
              {showAddItem && (
                <form onSubmit={handleAddItem} className="mb-3 flex items-center gap-2 rounded-md bg-surface-container/50 px-2 py-2">
                  <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Назва" autoFocus
                    className="h-7 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  <input value={newItemCost} onChange={(e) => setNewItemCost(e.target.value)} placeholder="₴" type="number" step="0.01"
                    className="h-7 w-20 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                  <input value={newItemUrl} onChange={(e) => setNewItemUrl(e.target.value)} placeholder="URL"
                    className="h-7 w-28 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                  <button type="submit" disabled={!newItemTitle.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-on-primary disabled:opacity-30">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowAddItem(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
                </form>
              )}

              <div className="space-y-0.5">
                {project.items.map((item) => (
                  editingItemId === item.id ? (
                    <div key={item.id} className="flex items-center gap-2 rounded-md bg-surface-container/50 px-2 py-1.5">
                      <input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEditItem(); if (e.key === 'Escape') setEditingItemId(null) }}
                        className="h-7 flex-1 rounded border border-primary bg-surface-container px-2 text-sm focus:outline-none" />
                      <input value={editItemCost} onChange={(e) => setEditItemCost(e.target.value)} placeholder="₴" type="number" step="0.01"
                        className="h-7 w-20 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                      <input value={editItemUrl} onChange={(e) => setEditItemUrl(e.target.value)} placeholder="URL"
                        className="h-7 w-28 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                      <button onClick={saveEditItem} className="text-primary"><Check className="size-3.5" /></button>
                      <button onClick={() => setEditingItemId(null)} className="text-muted-foreground"><X className="size-3.5" /></button>
                    </div>
                  ) : (
                    <div key={item.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-container/50">
                      <button onClick={() => cycleItemStatus(item.id, item.status)}
                        className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors',
                          item.status === 'done' ? 'border-success bg-success text-white' : item.status === 'in_progress' ? 'border-primary text-primary' : 'border-outline')}>
                        {item.status === 'done' && <Check className="size-3" />}
                        {item.status === 'in_progress' && '•'}
                      </button>
                      <span className={cn('flex-1 text-sm cursor-pointer', item.status === 'done' && 'text-muted-foreground line-through')}
                        onDoubleClick={() => startEditItem(item)}>{item.title}</span>
                      {item.estimatedCost != null && (
                        <span className="text-xs text-muted-foreground">₴{Number(item.estimatedCost).toLocaleString()}</span>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-primary"><ExternalLink className="size-3.5" /></a>
                      )}
                      <button onClick={() => startEditItem(item)}
                        className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"><Pencil className="size-3" /></button>
                      <button onClick={() => deleteItem(item.id)}
                        className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><X className="size-3.5" /></button>
                    </div>
                  )
                ))}
              </div>
            </section>

            <div className="my-6 border-t border-outline-variant/15" />

            {/* ── Project Tasks ── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Задачі проєкту</h2>
                  {project.tasks.length > 0 && <span className="text-xs text-muted-foreground">{project.tasks.filter((t) => t.status === 'done').length}/{project.tasks.length}</span>}
                </div>
                <button onClick={() => setShowAddTask(!showAddTask)}
                  className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground">
                  <Plus className="size-3.5" /> Задача
                </button>
              </div>

              {/* Add task form (top) */}
              {showAddTask && (
                <form onSubmit={handleAddTask} className="mb-3 flex items-center gap-2 rounded-md bg-surface-container/50 px-2 py-2">
                  <input value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Назва задачі" autoFocus
                    className="h-7 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                  <button type="submit" disabled={!newTaskTitle.trim()}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary text-on-primary disabled:opacity-30">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowAddTask(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
                </form>
              )}

              {/* Grouped by status */}
              {['new', 'in_progress', 'done', 'archived'].map((status) => {
                const statusTasks = project.tasks.filter((t) => t.status === status)
                if (statusTasks.length === 0) return null
                const collapsed = collapsedStatuses[status]
                return (
                  <div key={status} className="mb-2">
                    <button onClick={() => toggleStatusGroup(status)}
                      className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      {collapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                      {TASK_STATUS_LABELS[status] || status} <span className="opacity-60">({statusTasks.length})</span>
                    </button>
                    {!collapsed && (
                      <div className="space-y-0.5 pl-1">
                        {statusTasks.map((t) => (
                          <div key={t.id} className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-container/50">
                            <span className={cn('h-2 w-2 shrink-0 rounded-full', TASK_STATUS_DOT[t.status] || 'bg-muted-foreground/30')} />
                            <Link href={`/tasks/${t.id}`} className="flex-1 text-sm text-foreground hover:text-primary">{t.title}</Link>
                            {t.assignedTo && <span className="text-[10px] text-muted-foreground">{t.assignedTo.firstName}</span>}
                            <button onClick={() => handleRemoveTask(t.id)}
                              className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><X className="size-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}

              {project.tasks.length === 0 && !showAddTask && (
                <p className="text-xs text-muted-foreground/50 italic">Задач ще немає</p>
              )}
            </section>

            <div className="my-6 border-t border-outline-variant/15" />

            {/* Description */}
            {editing ? (
              <textarea ref={textareaRef} value={description}
                onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                placeholder="Опис проєкту... (підтримується Markdown)"
                className="mb-8 min-h-[100px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            ) : description ? (
              <div className="mb-8"><MarkdownRenderer content={description} /></div>
            ) : null}
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="p-5">{sidebarContent}</div>
        </aside>
      </div>

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
