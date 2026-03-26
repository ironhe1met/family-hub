'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Trash2, ListTodo, AlertCircle, Pencil, CalendarDays,
  List, Columns3, ChevronDown, X, Check, AlignLeft, FolderOpen,
} from 'lucide-react'
import {
  DndContext, DragOverlay, closestCorners,
  useSensor, useSensors, PointerSensor, TouchSensor,
  useDroppable,
  type DragStartEvent, type DragEndEvent, type DragOverEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '@/lib/supabase'
import { strings } from '@/lib/i18n'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Task, TaskList, TaskPriority, TaskStatus } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUSES: TaskStatus[] = ['new', 'in_progress', 'done', 'archived']

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  new:         { label: strings.statusNew,        color: '#6750A4' },
  in_progress: { label: strings.statusInProgress, color: '#E8A317' },
  done:        { label: strings.statusDone,       color: '#4CAF50' },
  archived:    { label: strings.statusArchived,   color: '#9E9E9E' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  high:   { label: strings.priorityHigh,   color: '#F44336', bg: 'rgba(244,67,54,0.12)' },
  medium: { label: strings.priorityMedium, color: '#FF9800', bg: 'rgba(255,152,0,0.12)' },
  low:    { label: strings.priorityLow,    color: '#2196F3', bg: 'rgba(33,150,243,0.12)' },
}

type ViewMode = 'list' | 'kanban'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d) < today
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getColumnFromOverId(overId: string | number, tasks: Task[]): TaskStatus | null {
  if (STATUSES.includes(overId as TaskStatus)) return overId as TaskStatus
  return tasks.find(t => t.id === overId)?.status ?? null
}

// ─── Backdrop & Sheet ─────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-40 bg-black/50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }} onClick={onClose} />
  )
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-lg bg-surface-container-high p-6 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={e => e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>
    </>
  )
}

// ─── Pickers ──────────────────────────────────────────────────────────────────

function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (v: TaskPriority) => void }) {
  return (
    <div className="flex gap-2">
      {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => {
        const cfg = PRIORITY_CONFIG[p]; const isActive = value === p
        return (
          <button key={p} type="button" onClick={() => onChange(p)}
            className="flex-1 h-10 rounded-md text-xs font-medium transition-all active:scale-[0.97]"
            style={{
              backgroundColor: isActive ? cfg.bg : 'var(--surface-container-highest)',
              color: isActive ? cfg.color : 'var(--muted-foreground)',
              border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
            }}>{cfg.label}</button>
        )
      })}
    </div>
  )
}

function StatusPicker({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  return (
    <div className="flex gap-1.5">
      {STATUSES.map(s => {
        const cfg = STATUS_CONFIG[s]; const isActive = value === s
        return (
          <button key={s} type="button" onClick={() => onChange(s)}
            className="flex-1 h-9 rounded-md text-[11px] font-medium transition-all active:scale-[0.97]"
            style={{
              backgroundColor: isActive ? `${cfg.color}18` : 'var(--surface-container-highest)',
              color: isActive ? cfg.color : 'var(--muted-foreground)',
              border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
            }}>{cfg.label}</button>
        )
      })}
    </div>
  )
}

function DatePickerButton({ value, onChange }: { value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-11 items-center gap-3 rounded-md bg-surface-container-high px-3
                   text-sm outline-none hover:bg-surface-container-highest transition w-full">
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className={`flex-1 text-left ${value ? 'text-foreground' : 'text-muted-foreground/50'}`}>
          {value ? value.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }) : strings.tasksNoDeadline}
        </span>
        {value && (
          <span role="button" tabIndex={0}
            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onChange(undefined) }}
            className="text-muted-foreground/40 hover:text-foreground text-xs cursor-pointer select-none">✕</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={d => { onChange(d); setOpen(false) }} className="rounded-md" />
      </PopoverContent>
    </Popover>
  )
}

// ─── View Toggle ──────────────────────────────────────────────────────────────

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="relative flex h-9 w-[200px] rounded-md border border-outline-variant/30 overflow-hidden">
      {([
        { mode: 'list' as ViewMode, icon: List, label: strings.tasksList },
        { mode: 'kanban' as ViewMode, icon: Columns3, label: strings.tasksKanban },
      ]).map(({ mode, icon: Icon, label }) => (
        <button key={mode} onClick={() => onChange(mode)}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
            value === mode ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}>
          <Icon className="size-3.5" />{label}
          {value === mode && (
            <motion.div layoutId="seg" className="absolute inset-0 bg-primary/10"
              transition={{ type: 'spring', damping: 30, stiffness: 400 }} />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Google Tasks Style Card (List view) ──────────────────────────────────────

function TaskListItem({ item, onToggle, onEdit, onDelete }: {
  item: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void
}) {
  const pcfg = PRIORITY_CONFIG[item.priority]
  const overdue = item.status !== 'done' && item.status !== 'archived' && isOverdue(item.due_date)
  const isDone = item.status === 'done' || item.status === 'archived'

  return (
    <div className={`group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors
      ${isDone ? 'opacity-50' : 'hover:bg-surface-container-high'}`}>
      {/* Round checkbox (Google Tasks style) */}
      <button onClick={onToggle}
        className="mt-0.5 shrink-0 flex h-[20px] w-[20px] items-center justify-center
                   rounded-[3px] border-2 transition-all duration-200 active:scale-85"
        style={isDone
          ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)' }
          : { borderColor: pcfg.color }
        }>
        {isDone && (
          <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <span className={`block select-none text-sm leading-snug ${
          isDone ? 'text-muted-foreground line-through' : 'text-foreground'
        }`}>{item.name}</span>
        {item.description && !isDone && (
          <span className="block mt-0.5 text-xs text-muted-foreground/60 line-clamp-1">{item.description}</span>
        )}
        {item.due_date && (
          <span className={`text-[11px] mt-0.5 block ${
            overdue ? 'text-destructive font-medium' : 'text-muted-foreground'
          }`}>{overdue ? strings.tasksOverdue : ''}{formatDate(item.due_date)}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 mt-0.5 transition-opacity">
        <button onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition">
          <Pencil className="size-3" />
        </button>
        <button onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition">
          <Trash2 className="size-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function TaskCard({ item, onToggle, onEdit, onDelete, isDragging }: {
  item: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; isDragging?: boolean
}) {
  const pcfg = PRIORITY_CONFIG[item.priority]
  const overdue = item.status !== 'done' && item.status !== 'archived' && isOverdue(item.due_date)
  const isDone = item.status === 'done' || item.status === 'archived'

  return (
    <div className={`group flex items-start gap-2.5 rounded-md px-3 py-2.5 transition-all ${
      isDragging ? 'bg-surface-container-highest shadow-xl ring-2 ring-primary/30' :
      isDone ? 'opacity-50' : 'bg-surface-container-high hover:bg-surface-container-highest'
    }`}>
      <button onClick={onToggle}
        className="mt-0.5 shrink-0 flex h-[18px] w-[18px] items-center justify-center
                   rounded-[3px] border-2 transition-all active:scale-85"
        style={isDone ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)' } : { borderColor: pcfg.color }}>
        {isDone && (
          <svg className="size-2 text-white" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`block text-sm leading-snug ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{item.name}</span>
        {item.due_date && (
          <span className={`text-[11px] mt-0.5 block ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
            {formatDate(item.due_date)}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5 mt-0.5 transition-opacity">
        <button onClick={onEdit} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition">
          <Pencil className="size-2.5" />
        </button>
        <button onClick={onDelete} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/40 hover:text-destructive transition">
          <Trash2 className="size-2.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Sortable Kanban Card ─────────────────────────────────────────────────────

function SortableTaskCard(props: { item: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }} {...attributes} {...listeners}>
      <TaskCard {...props} />
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, onToggle, onEdit, onDelete }: {
  status: TaskStatus; tasks: Task[]; onToggle: (t: Task) => void; onEdit: (t: Task) => void; onDelete: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div ref={setNodeRef} className={`flex flex-col overflow-hidden rounded-md bg-surface-container transition-all ${
      isOver ? 'ring-1 ring-primary/30 bg-surface-container-high' : ''
    }`}>
      <div className="h-[3px]" style={{ backgroundColor: cfg.color }} />
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <span className="size-2 rounded-md" style={{ backgroundColor: cfg.color }} />
        <span className="text-sm font-medium">{cfg.label}</span>
        <span className="ml-auto rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="h-px bg-outline-variant/15" />
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-1.5 p-2 min-h-[60px]">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-xs text-muted-foreground/30">{strings.tasksDragHere}</div>
          ) : tasks.map(task => (
            <SortableTaskCard key={task.id} item={task}
              onToggle={() => onToggle(task)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── Unified Task Form (Google Tasks style) ──────────────────────────────────

function TaskFormDialog({ item, taskLists, onSubmit, onClose, submitLabel }: {
  item?: Task
  taskLists: TaskList[]
  onSubmit: (data: { name: string; description: string | null; dueDate: string | null; priority: TaskPriority; status: TaskStatus; listName: string }) => void
  onClose: () => void
  submitLabel: string
}) {
  const [name, setName] = useState(item?.name ?? '')
  const [desc, setDesc] = useState(item?.description ?? '')
  const [dueDate, setDueDate] = useState<Date | undefined>(item?.due_date ? parseDateLocal(item.due_date) : undefined)
  const [priority, setPriority] = useState<TaskPriority>(item?.priority ?? 'medium')
  const [status, setStatus] = useState<TaskStatus>(item?.status ?? 'new')
  const [listName, setListName] = useState(item?.list_name ?? taskLists[0]?.name ?? '')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  function handle(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: desc.trim() || null, dueDate: dueDate ? toDateOnly(dueDate) : null, priority, status, listName })
    onClose()
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handle} className="flex flex-col gap-3">
        {/* Name — underline style, large text, acts as header */}
        <input ref={nameRef} value={name} onChange={e => setName(e.target.value)}
          placeholder={strings.tasksNamePlaceholder}
          className="h-12 border-b-2 border-outline-variant/30 bg-transparent px-0 text-xl font-medium
                     outline-none placeholder:text-muted-foreground/25
                     focus:border-primary transition-colors" />

        {/* Description — icon row */}
        <div className="flex items-start gap-3">
          <AlignLeft className="mt-3 size-4 shrink-0 text-muted-foreground/50" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder={strings.tasksDescPlaceholder} rows={2}
            className="flex-1 rounded-md bg-surface-container-high px-3 py-2.5 text-sm leading-relaxed
                       outline-none focus:ring-1 focus:ring-primary/30 transition resize-none" />
        </div>

        {/* Deadline — icon row */}
        <div className="flex items-center gap-3">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground/50" />
          <div className="flex-1">
            <DatePickerButton value={dueDate} onChange={setDueDate} />
          </div>
        </div>

        {/* List selector — icon row */}
        <div className="flex items-center gap-3">
          <FolderOpen className="size-4 shrink-0 text-muted-foreground/50" />
          <select value={listName} onChange={e => setListName(e.target.value)}
            className="h-11 flex-1 rounded-md bg-surface-container-high px-3 text-sm
                       outline-none hover:bg-surface-container-highest focus:ring-1 focus:ring-primary/30 transition appearance-none">
            {taskLists.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
          </select>
        </div>

        {/* Priority */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{strings.tasksPriority}</span>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>

        {/* Status (only when editing) */}
        {item && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{strings.tasksStatus}</span>
            <StatusPicker value={status} onChange={setStatus} />
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:bg-primary/8 active:scale-[0.98] transition">
            {strings.cancel}
          </button>
          <button type="submit" disabled={!name.trim()}
            className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground hover:opacity-90 active:scale-[0.98] disabled:opacity-30 transition">
            {submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Status Section (List view) ───────────────────────────────────────────────

function StatusSection({ status, tasks, collapsed, onToggleCollapse, onToggle, onEdit, onDelete }: {
  status: TaskStatus; tasks: Task[]; collapsed: boolean; onToggleCollapse: () => void
  onToggle: (t: Task) => void; onEdit: (t: Task) => void; onDelete: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[status]
  if (tasks.length === 0 && status === 'archived') return null

  return (
    <div className="mb-3 rounded-md bg-surface-container overflow-hidden">
      <button onClick={onToggleCollapse}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container-high transition">
        <div className="h-4 w-[3px] rounded-md" style={{ backgroundColor: cfg.color }} />
        <span className="text-sm font-medium">{cfg.label}</span>
        <span className="rounded-md bg-surface-container-high px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{tasks.length}</span>
        <ChevronDown className={`ml-auto size-4 text-muted-foreground/40 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <>
          <div className="h-px bg-outline-variant/15" />
          {tasks.length > 0 ? (
            <div className="p-1.5">
              {tasks.map(task => (
                <TaskListItem key={task.id} item={task}
                  onToggle={() => onToggle(task)} onEdit={() => onEdit(task)} onDelete={() => onDelete(task.id)} />
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground/30">{strings.tasksNoTasks}</p>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function TasksPage() {
  const [familyId, setFamilyId]       = useState<string | null>(null)
  const [tasks, setTasks]             = useState<Task[]>([])
  const [taskLists, setTaskLists]     = useState<TaskList[]>([])
  const [activeListName, setActiveListName] = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [viewMode, setViewMode]       = useState<ViewMode>('list')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editingItem, setEditingItem] = useState<Task | null>(null)
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<TaskStatus, boolean>>({
    new: false, in_progress: false, done: false, archived: true,
  })
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [renamingList, setRenamingList] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')

  const newListRef = useRef<HTMLInputElement>(null)
  const renameRef  = useRef<HTMLInputElement>(null)

  // Filter tasks by active list (null = show all)
  const showAll = activeListName === null
  const filteredTasks = useMemo(() => {
    if (showAll) return tasks
    return tasks.filter(t => (t.list_name ?? strings.tasksDefaultList) === activeListName)
  }, [tasks, activeListName, showAll])

  const tasksByStatus = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = { new: [], in_progress: [], done: [], archived: [] }
    for (const t of filteredTasks) result[t.status]?.push(t)
    for (const s of STATUSES) result[s].sort((a, b) => a.sort_order - b.sort_order)
    return result
  }, [filteredTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  // ── Init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileErr } = await supabase
        .from('profiles').select('family_id').eq('id', user.id).single()

      if (profileErr || !profile) { setError(strings.profileNotFound); setLoading(false); return }

      const fid: string = profile.family_id
      setFamilyId(fid)

      // Fetch task lists
      const { data: listData } = await supabase
        .from('task_lists').select('*').eq('family_id', fid).order('sort_order')

      let fetchedLists: TaskList[] = (listData as TaskList[]) ?? []

      // Fetch tasks
      const { data, error: fetchErr } = await supabase
        .from('tasks').select('*').eq('family_id', fid).order('sort_order', { ascending: true })

      if (fetchErr) { setError(strings.loadError(fetchErr.message)); setLoading(false); return }
      if (data) setTasks(data as Task[])

      // If no task_lists table yet, create default
      if (fetchedLists.length === 0) {
        fetchedLists = [{ id: crypto.randomUUID(), family_id: fid, name: strings.tasksDefaultList, sort_order: 0, created_at: new Date().toISOString() }]
      }

      setTaskLists(fetchedLists)
      // Start with "All" tab selected
      setLoading(false)
    }
    init()
  }, [])

  // ── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId) return
    const ch = supabase.channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === 'UPDATE' && activeId && payload.new && (payload.new as Task).id === activeId) return
          if (payload.eventType === 'INSERT') {
            const item = payload.new as Task
            setTasks(prev => prev.some(t => t.id === item.id) ? prev : [...prev, item])
          }
          if (payload.eventType === 'UPDATE') { setTasks(prev => prev.map(t => t.id === (payload.new as Task).id ? (payload.new as Task) : t)) }
          if (payload.eventType === 'DELETE') { setTasks(prev => prev.filter(t => t.id !== payload.old.id)) }
        }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [familyId, activeId])

  // ── List management ─────────────────────────────────────────────────────

  async function handleAddTaskList(e: React.FormEvent) {
    e.preventDefault()
    const raw = newListName.trim()
    if (!raw || !familyId) return
    const name = taskLists.some(l => l.name === raw) ? `${raw} 2` : raw
    const temp: TaskList = { id: crypto.randomUUID(), family_id: familyId, name, sort_order: taskLists.length, created_at: new Date().toISOString() }
    setTaskLists(prev => [...prev, temp])
    setActiveListName(name)
    setNewListName(''); setShowNewList(false)
    const { data } = await supabase.from('task_lists').insert({ family_id: familyId, name, sort_order: taskLists.length }).select().single()
    if (data) setTaskLists(prev => prev.map(l => l.id === temp.id ? (data as TaskList) : l))
  }

  async function handleRenameTaskList() {
    if (!renamingList || !renameValue.trim() || !familyId) return
    const oldName = renamingList; const newName = renameValue.trim()
    if (oldName === newName) { setRenamingList(null); return }
    setTaskLists(prev => prev.map(l => l.name === oldName ? { ...l, name: newName } : l))
    setTasks(prev => prev.map(t => t.list_name === oldName ? { ...t, list_name: newName } : t))
    if (activeListName === oldName) setActiveListName(newName)
    setRenamingList(null)
    await supabase.from('task_lists').update({ name: newName }).eq('family_id', familyId).eq('name', oldName)
    await supabase.from('tasks').update({ list_name: newName }).eq('family_id', familyId).eq('list_name', oldName)
  }

  async function handleDeleteTaskList(name: string) {
    if (!familyId) return
    const remaining = taskLists.filter(l => l.name !== name)
    setTasks(prev => prev.filter(t => t.list_name !== name))
    setTaskLists(remaining)
    setActiveListName(remaining[0]?.name ?? null)
    await supabase.from('tasks').delete().eq('family_id', familyId).eq('list_name', name)
    await supabase.from('task_lists').delete().eq('family_id', familyId).eq('name', name)
  }

  // ── Task CRUD ───────────────────────────────────────────────────────────

  async function handleAdd(name: string, description: string | null, dueDate: string | null, priority: TaskPriority, listName: string) {
    if (!familyId) return
    const targetList = listName || activeListName || strings.tasksDefaultList
    const tempId = crypto.randomUUID()
    const sortOrder = Math.floor(Date.now() / 1000)
    const temp: Task = { id: tempId, family_id: familyId, name, description, list_name: targetList, due_date: dueDate, priority, status: 'new', sort_order: sortOrder, created_at: new Date().toISOString() }
    setTasks(prev => [...prev, temp]); setShowAddSheet(false)
    const { data, error } = await supabase.from('tasks')
      .insert({ family_id: familyId, name, ...(description != null && { description }), list_name: targetList, due_date: dueDate, priority, sort_order: sortOrder })
      .select().single()
    if (error) { setTasks(prev => prev.filter(t => t.id !== tempId)) }
    else { setTasks(prev => prev.map(t => t.id === tempId ? (data as Task) : t)) }
  }

  async function handleToggleStatus(item: Task) {
    const next: TaskStatus = item.status === 'done' ? 'new' : 'done'
    setTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: next } : t))
    const { error } = await supabase.from('tasks').update({ status: next }).eq('id', item.id)
    if (error) setTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: item.status } : t))
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function handleSaveEdit(id: string, data: { name: string; description: string | null; dueDate: string | null; priority: TaskPriority; status: TaskStatus; listName: string }) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, name: data.name, description: data.description, due_date: data.dueDate, priority: data.priority, status: data.status, list_name: data.listName } : t))
    await supabase.from('tasks').update({ name: data.name, ...(data.description != null && { description: data.description }), due_date: data.dueDate, priority: data.priority, status: data.status, list_name: data.listName }).eq('id', id)
  }

  async function handleStatusChange(id: string, newStatus: TaskStatus) {
    const prev = tasks.find(t => t.id === id)
    if (!prev || prev.status === newStatus) return
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: newStatus } : t))
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    if (error) setTasks(ts => ts.map(t => t.id === id ? { ...t, status: prev.status } : t))
  }

  // ── DnD ─────────────────────────────────────────────────────────────────
  function handleDragStart(e: DragStartEvent) { setActiveId(e.active.id as string) }
  function handleDragOver(e: DragOverEvent) {
    if (!e.over) return
    const at = tasks.find(t => t.id === e.active.id); const oc = getColumnFromOverId(e.over!.id, tasks)
    if (at && oc && at.status !== oc) setTasks(prev => prev.map(t => t.id === at.id ? { ...t, status: oc } : t))
  }
  function handleDragEnd() {
    const id = activeId; setActiveId(null); if (!id) return
    const task = tasks.find(t => t.id === id); if (task) handleStatusChange(id, task.status)
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="size-7 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
  if (error) return <div className="flex flex-col items-center gap-3 p-8 pt-16 text-center"><AlertCircle className="size-10 text-destructive" /><p className="max-w-xs text-sm text-muted-foreground">{error}</p></div>

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 pt-4 pb-24 sm:px-6">

        {/* ── Task list tabs ───────────────────────────────── */}
        <div className="mb-3 flex items-center gap-2">
          {showNewList ? (
            <form onSubmit={handleAddTaskList} className="flex items-center gap-1.5">
              <input ref={newListRef} value={newListName} onChange={e => setNewListName(e.target.value)}
                placeholder={strings.listNamePlaceholder}
                onKeyDown={e => e.key === 'Escape' && (setShowNewList(false), setNewListName(''))}
                autoFocus
                className="h-8 w-28 rounded-md border border-primary/50 bg-surface-container-high px-3 text-xs outline-none focus:border-primary" />
              <button type="submit" disabled={!newListName.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground active:scale-90 disabled:opacity-30 transition">
                <Plus className="size-3.5" />
              </button>
              <button type="button" onClick={() => { setShowNewList(false); setNewListName('') }}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container-high transition">
                <X className="size-3.5" />
              </button>
            </form>
          ) : (
            <button onClick={() => { setShowNewList(true); setTimeout(() => newListRef.current?.focus(), 50) }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-dashed border-outline-variant text-muted-foreground hover:border-primary hover:text-primary active:scale-90 transition"
              title={strings.tasksNewList}>
              <Plus className="size-3.5" />
            </button>
          )}

          <div className="flex flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {/* "All" tab */}
            <button onClick={() => setActiveListName(null)}
              className={`shrink-0 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.97] ${
                showAll ? 'bg-primary/15 text-primary glow-primary-sm' : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
              }`}>{strings.tasksAllLists}</button>

            {taskLists.map(list => (
              <div key={list.id} className="flex shrink-0 items-center">
                {renamingList === list.name ? (
                  <form onSubmit={e => { e.preventDefault(); handleRenameTaskList() }} className="flex items-center gap-1">
                    <input ref={renameRef} value={renameValue} onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && setRenamingList(null)} autoFocus
                      className="h-7 w-24 rounded-md border border-primary/50 bg-surface-container-high px-2.5 text-xs outline-none" />
                    <button type="submit" className="flex h-6 w-6 items-center justify-center rounded-md text-primary hover:bg-primary/10"><Check className="size-3" /></button>
                    <button type="button" onClick={() => setRenamingList(null)} className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground"><X className="size-3" /></button>
                  </form>
                ) : (
                  <button onClick={() => setActiveListName(list.name)}
                    onDoubleClick={() => { setRenamingList(list.name); setRenameValue(list.name); setTimeout(() => renameRef.current?.focus(), 50) }}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.97] ${
                      activeListName === list.name
                        ? 'bg-primary/15 text-primary glow-primary-sm'
                        : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
                    }`}>{list.name}</button>
                )}
              </div>
            ))}
          </div>

          {/* Active list actions */}
          {activeListName && !showAll && taskLists.length > 1 && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => { setRenamingList(activeListName); setRenameValue(activeListName) }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition">
                <Pencil className="size-3" />
              </button>
              <button onClick={() => handleDeleteTaskList(activeListName)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition">
                <Trash2 className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* ── View toggle ──────────────────────────────── */}
        <div className="mb-4">
          <ViewToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* ── Content ──────────────────────────────────── */}
        {filteredTasks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center gap-5 px-8 pt-16 text-center">
            <div className="rounded-md bg-primary/8 p-6"><ListTodo className="size-12 text-primary/40" /></div>
            <p className="font-medium">{strings.tasksEmpty}</p>
            <p className="text-sm text-muted-foreground">{strings.tasksEmptySub}</p>
          </div>
        ) : viewMode === 'list' ? (
          <div>
            {STATUSES.map(status => (
              <StatusSection key={status} status={status} tasks={tasksByStatus[status]}
                collapsed={collapsedSections[status]}
                onToggleCollapse={() => setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }))}
                onToggle={handleToggleStatus} onEdit={setEditingItem} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners}
            onDragStart={handleDragStart} onDragOver={handleDragOver}
            onDragEnd={handleDragEnd} onDragCancel={() => setActiveId(null)}>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 sm:grid sm:grid-cols-4 sm:overflow-x-visible snap-x snap-mandatory sm:snap-none [&::-webkit-scrollbar]:hidden">
              {STATUSES.map(status => (
                <div key={status} className="w-[300px] shrink-0 snap-start sm:w-auto">
                  <KanbanColumn status={status} tasks={tasksByStatus[status]}
                    onToggle={handleToggleStatus} onEdit={setEditingItem} onDelete={handleDelete} />
                </div>
              ))}
            </div>
            <DragOverlay>{activeTask && <div className="w-[260px]"><TaskCard item={activeTask} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} isDragging /></div>}</DragOverlay>
          </DndContext>
        )}
      </div>

      {/* FAB — always visible */}
      <button onClick={() => setShowAddSheet(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center
                   rounded-xl bg-primary text-primary-foreground glow-primary
                   hover:scale-105 active:scale-90 transition-all">
        <Plus className="size-6" />
      </button>

      <AnimatePresence>
        {showAddSheet && (
          <TaskFormDialog key="add" taskLists={taskLists} submitLabel={strings.add}
            onSubmit={d => handleAdd(d.name, d.description, d.dueDate, d.priority, d.listName)}
            onClose={() => setShowAddSheet(false)} />
        )}
        {editingItem && (
          <TaskFormDialog key="edit" item={editingItem} taskLists={taskLists} submitLabel={strings.save}
            onSubmit={d => handleSaveEdit(editingItem.id, d)}
            onClose={() => setEditingItem(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
