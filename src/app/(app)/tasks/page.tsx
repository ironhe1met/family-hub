'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Plus, Trash2, ListTodo, AlertCircle, Pencil, CalendarDays,
  List, Columns3, ChevronDown,
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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Task, TaskPriority, TaskStatus } from '@/lib/types'

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUSES: TaskStatus[] = ['new', 'in_progress', 'done', 'archived']

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  new:         { label: 'Новые',      color: '#0A84FF' },
  in_progress: { label: 'В процессе', color: '#FF9F0A' },
  done:        { label: 'Выполнено',  color: '#34C759' },
  archived:    { label: 'Архив',      color: '#8E8E93' },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  high:   { label: 'Высокий', color: '#FF453A', bg: 'rgba(255,69,58,0.15)' },
  medium: { label: 'Средний', color: '#FFD60A', bg: 'rgba(255,214,10,0.15)' },
  low:    { label: 'Низкий',  color: '#0A84FF', bg: 'rgba(10,132,255,0.15)' },
}

type ViewMode = 'list' | 'kanban'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateOnly(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d) < today
}

function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function getColumnFromOverId(overId: string | number, tasks: Task[]): TaskStatus | null {
  if (STATUSES.includes(overId as TaskStatus)) return overId as TaskStatus
  const task = tasks.find(t => t.id === overId)
  return task?.status ?? null
}

// ─── Backdrop & Sheet ─────────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    />
  )
}

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <Backdrop onClose={onClose} />
      <motion.div
        className="fixed inset-x-4 bottom-6 z-50 max-h-[85dvh] overflow-y-auto rounded-3xl bg-[#2c2c2e] p-6 shadow-2xl
                   sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Priority Picker ──────────────────────────────────────────────────────────

function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (v: TaskPriority) => void }) {
  return (
    <div className="flex gap-2">
      {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => {
        const cfg = PRIORITY_CONFIG[p]
        const isActive = value === p
        return (
          <button
            key={p} type="button" onClick={() => onChange(p)}
            className="flex-1 h-10 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: isActive ? cfg.bg : 'rgba(255,255,255,0.05)',
              color: isActive ? cfg.color : 'rgba(255,255,255,0.4)',
              border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
            }}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Status Picker ────────────────────────────────────────────────────────────

function StatusPicker({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  return (
    <div className="flex gap-1.5">
      {STATUSES.map(s => {
        const cfg = STATUS_CONFIG[s]
        const isActive = value === s
        return (
          <button
            key={s} type="button" onClick={() => onChange(s)}
            className="flex-1 h-9 rounded-xl text-[11px] font-semibold transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: isActive ? `${cfg.color}20` : 'rgba(255,255,255,0.05)',
              color: isActive ? cfg.color : 'rgba(255,255,255,0.4)',
              border: isActive ? `1.5px solid ${cfg.color}40` : '1.5px solid transparent',
            }}
          >
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Date Picker ──────────────────────────────────────────────────────────────

function DatePickerButton({ value, onChange }: { value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-12 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4
                   text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition w-full"
      >
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className={value ? 'text-foreground' : 'text-muted-foreground/40'}>
          {value ? value.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Без дедлайна'}
        </span>
        {value && (
          <button type="button" onClick={e => { e.stopPropagation(); onChange(undefined) }}
            className="ml-auto text-muted-foreground/40 hover:text-foreground text-xs">
            ✕
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value}
          onSelect={d => { onChange(d); setOpen(false) }} className="rounded-2xl" />
      </PopoverContent>
    </Popover>
  )
}

// ─── View Toggle (Segmented Control) ──────────────────────────────────────────

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="relative flex h-10 w-[220px] rounded-2xl bg-white/[0.08] p-1">
      {([
        { mode: 'list' as ViewMode, icon: List, label: 'Список' },
        { mode: 'kanban' as ViewMode, icon: Columns3, label: 'Канбан' },
      ]).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl
                     text-[13px] font-semibold transition-colors duration-200 active:scale-95 ${
            value === mode
              ? 'text-foreground'
              : 'text-muted-foreground/60 hover:text-muted-foreground'
          }`}
        >
          <Icon className="size-3.5" />
          {label}
          {value === mode && (
            <motion.div
              layoutId="segment-indicator"
              className="absolute inset-0 rounded-xl bg-[#2c2c2e] shadow-sm shadow-black/30"
              style={{ zIndex: -1 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            />
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Task Card (shared between views) ─────────────────────────────────────────

function TaskCard({ item, onToggle, onEdit, onDelete, isDragging }: {
  item: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  isDragging?: boolean
}) {
  const pcfg = PRIORITY_CONFIG[item.priority]
  const overdue = item.status !== 'done' && item.status !== 'archived' && isOverdue(item.due_date)
  const isDone = item.status === 'done' || item.status === 'archived'

  return (
    <div className={`group flex items-start gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
      isDragging ? 'bg-[#3a3a3c] shadow-xl ring-2 ring-primary/30' :
      isDone ? 'bg-white/3' : 'bg-[#2c2c2e] shadow-sm shadow-black/20 hover:bg-white/8'
    }`}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="mt-0.5 shrink-0 flex h-[22px] w-[22px] items-center justify-center
                   rounded-md border-2 transition-all duration-200 active:scale-85"
        style={isDone
          ? { backgroundColor: '#34C759', borderColor: '#34C759' }
          : { borderColor: 'rgba(255,255,255,0.2)' }
        }
      >
        {isDone && (
          <svg className="size-3 text-white" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Name + Description + Date */}
      <div className="flex-1 min-w-0">
        <span className={`block select-none text-[15px] leading-snug transition-all duration-200 ${
          isDone ? 'text-foreground/40 line-through decoration-foreground/20' : 'text-foreground'
        }`}>
          {item.name}
        </span>
        {item.description && (
          <span className={`block mt-0.5 text-xs leading-relaxed line-clamp-2 ${
            isDone ? 'text-foreground/20' : 'text-muted-foreground/50'
          }`}>
            {item.description}
          </span>
        )}
        {item.due_date && (
          <span className={`text-xs mt-0.5 block ${
            overdue ? 'text-[#FF453A] font-medium' :
            isDone ? 'text-foreground/25' : 'text-muted-foreground/60'
          }`}>
            {overdue ? 'Просрочено: ' : ''}{formatDate(item.due_date)}
          </span>
        )}
      </div>

      {/* Priority dot + actions */}
      <div className="flex shrink-0 items-center gap-1.5 mt-0.5">
        <span className="size-2.5 rounded-full shrink-0"
          style={{ backgroundColor: pcfg.color }} title={pcfg.label} />
        <button onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-xl
                     text-muted-foreground/30 hover:bg-white/8 hover:text-muted-foreground
                     active:scale-90 transition opacity-0 group-hover:opacity-100">
          <Pencil className="size-3.5" />
        </button>
        <button onClick={onDelete}
          className="flex h-8 w-8 items-center justify-center rounded-xl
                     text-muted-foreground/30 hover:bg-destructive/15 hover:text-destructive
                     active:scale-90 transition">
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── Sortable Task Card (for Kanban) ──────────────────────────────────────────

function SortableTaskCard({ item, onToggle, onEdit, onDelete }: {
  item: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard item={item} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, onToggle, onEdit, onDelete }: {
  status: TaskStatus
  tasks: Task[]
  onToggle: (item: Task) => void
  onEdit: (item: Task) => void
  onDelete: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col overflow-hidden rounded-2xl bg-[#2c2c2e]/50 shadow-sm shadow-black/10
                  transition-all duration-200 ${
        isOver ? 'bg-[#2c2c2e]/80 ring-1 ring-primary/30 shadow-md' : ''
      }`}
    >
      {/* Colored top bar — inside overflow-hidden so it respects border-radius */}
      <div className="h-[3px]" style={{ backgroundColor: cfg.color }} />

      {/* Column header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
        <span className="text-[15px] font-semibold text-foreground">{cfg.label}</span>
        <span className="ml-auto rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="h-px bg-white/6" />

      {/* Cards */}
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2.5 p-3 min-h-[80px]">
          {tasks.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground/30">
              Перетащите сюда
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard
                key={task.id}
                item={task}
                onToggle={() => onToggle(task)}
                onEdit={() => onEdit(task)}
                onDelete={() => onDelete(task.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── Edit Dialog ──────────────────────────────────────────────────────────────

function EditDialog({ item, onSave, onClose }: {
  item: Task
  onSave: (name: string, description: string | null, dueDate: string | null, priority: TaskPriority, status: TaskStatus) => void
  onClose: () => void
}) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description ?? '')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    item.due_date ? parseDateLocal(item.due_date) : undefined
  )
  const [priority, setPriority] = useState<TaskPriority>(item.priority)
  const [status, setStatus] = useState<TaskStatus>(item.status)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const dateStr = dueDate ? toDateOnly(dueDate) : null
    onSave(name.trim(), description.trim() || null, dateStr, priority, status)
    onClose()
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold">Редактировать задачу</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Название</span>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Описание</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Подробности задачи..."
            rows={3}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition resize-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Дедлайн</span>
          <DatePickerButton value={dueDate} onChange={setDueDate} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Приоритет</span>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Статус</span>
          <StatusPicker value={status} onChange={setStatus} />
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-white/10 text-sm font-medium
                       text-muted-foreground hover:bg-white/8 active:scale-95 transition">
            Отмена
          </button>
          <button type="submit" disabled={!name.trim()}
            className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold
                       hover:opacity-85 active:scale-95 disabled:opacity-30 transition">
            Сохранить
          </button>
        </div>
      </form>
    </Sheet>
  )
}

// ─── Add Task Sheet ───────────────────────────────────────────────────────────

function AddTaskSheet({ onAdd, onClose }: {
  onAdd: (name: string, description: string | null, dueDate: string | null, priority: TaskPriority) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const dateStr = dueDate ? toDateOnly(dueDate) : null
    onAdd(name.trim(), description.trim() || null, dateStr, priority)
    setName('')
    setDescription('')
    setDueDate(undefined)
    setPriority('medium')
    inputRef.current?.focus()
  }

  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold">Новая задача</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Название</span>
          <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
            placeholder="Что нужно сделать?"
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Описание</span>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Подробности задачи..."
            rows={3}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-relaxed
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition resize-none" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Дедлайн</span>
          <DatePickerButton value={dueDate} onChange={setDueDate} />
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Приоритет</span>
          <PriorityPicker value={priority} onChange={setPriority} />
        </div>
        <div className="mt-1 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-white/10 text-sm font-medium
                       text-muted-foreground hover:bg-white/8 active:scale-95 transition">
            Отмена
          </button>
          <button type="submit" disabled={!name.trim()}
            className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold
                       hover:opacity-85 active:scale-95 disabled:opacity-30 transition">
            Добавить
          </button>
        </div>
      </form>
    </Sheet>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-5 px-8 pt-20 text-center"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-3xl bg-white/4 p-6">
        <ListTodo className="size-12 text-muted-foreground/20" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">Задач пока нет</p>
        <p className="text-sm text-muted-foreground/60">Создайте первую задачу</p>
      </div>
      <button onClick={onCreate}
        className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-6
                   text-sm font-semibold text-primary-foreground
                   hover:opacity-85 active:scale-95 transition">
        <Plus className="size-4" /> Добавить задачу
      </button>
    </motion.div>
  )
}

// ─── List View — Status Section ───────────────────────────────────────────────

function StatusSection({ status, tasks, collapsed, onToggleCollapse, onToggle, onEdit, onDelete }: {
  status: TaskStatus
  tasks: Task[]
  collapsed: boolean
  onToggleCollapse: () => void
  onToggle: (item: Task) => void
  onEdit: (item: Task) => void
  onDelete: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[status]
  if (tasks.length === 0 && status === 'archived') return null

  return (
    <div className="mb-8">
      {/* Section header */}
      <button onClick={onToggleCollapse}
        className="flex w-full items-center gap-3 px-1 py-2 hover:opacity-80 active:scale-[0.99] transition">
        <div className="h-5 w-[3px] rounded-full" style={{ backgroundColor: cfg.color }} />
        <span className="text-[15px] font-bold text-foreground">{cfg.label}</span>
        <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
          {tasks.length}
        </span>
        <ChevronDown className={`ml-auto size-4 text-muted-foreground/40 transition-transform duration-200 ${
          collapsed ? '-rotate-90' : ''
        }`} />
      </button>

      <div className="h-px bg-white/6 mt-1 mb-3" />

      <AnimatePresence initial={false}>
        {!collapsed && tasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <motion.ul layout className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {tasks.map(task => (
                  <motion.li
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  >
                    <TaskCard
                      item={task}
                      onToggle={() => onToggle(task)}
                      onEdit={() => onEdit(task)}
                      onDelete={() => onDelete(task.id)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </motion.div>
        )}
        {!collapsed && tasks.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="py-4 text-center text-xs text-muted-foreground/30"
          >
            Нет задач
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default function TasksPage() {
  const [familyId, setFamilyId]       = useState<string | null>(null)
  const [tasks, setTasks]             = useState<Task[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [viewMode, setViewMode]       = useState<ViewMode>('list')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [editingItem, setEditingItem] = useState<Task | null>(null)
  const [activeId, setActiveId]       = useState<string | null>(null)
  const [collapsedSections, setCollapsedSections] = useState<Record<TaskStatus, boolean>>({
    new: false, in_progress: false, done: false, archived: true,
  })

  // ── Derived data ────────────────────────────────────────────────────────
  const tasksByStatus = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = { new: [], in_progress: [], done: [], archived: [] }
    for (const t of tasks) {
      result[t.status]?.push(t)
    }
    for (const s of STATUSES) {
      result[s].sort((a, b) => a.sort_order - b.sort_order)
    }
    return result
  }, [tasks])

  const totalCount = tasks.length

  // ── DnD sensors ─────────────────────────────────────────────────────────
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

      if (profileErr || !profile) {
        setError('Профиль не найден. Запустите SQL-скрипт для создания профилей.')
        setLoading(false)
        return
      }

      const fid: string = profile.family_id
      setFamilyId(fid)

      const { data, error: fetchErr } = await supabase
        .from('tasks').select('*').eq('family_id', fid).order('sort_order', { ascending: true })

      if (fetchErr) {
        setError(`Ошибка загрузки: ${fetchErr.message}`)
        setLoading(false)
        return
      }

      if (data) setTasks(data as Task[])
      setLoading(false)
    }
    init()
  }, [])

  // ── Realtime ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId) return
    const ch = supabase
      .channel('tasks-rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `family_id=eq.${familyId}` },
        (payload) => {
          // Skip updates for task being dragged to avoid visual glitches
          if (payload.eventType === 'UPDATE' && activeId && payload.new && (payload.new as Task).id === activeId) return

          if (payload.eventType === 'INSERT') {
            const item = payload.new as Task
            setTasks(prev => prev.some(t => t.id === item.id) ? prev : [...prev, item])
          }
          if (payload.eventType === 'UPDATE') {
            const item = payload.new as Task
            setTasks(prev => prev.map(t => t.id === item.id ? item : t))
          }
          if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [familyId, activeId])

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleAdd(name: string, description: string | null, dueDate: string | null, priority: TaskPriority) {
    if (!familyId) return

    const tempId = crypto.randomUUID()
    const sortOrder = Math.floor(Date.now() / 1000)
    const temp: Task = {
      id: tempId, family_id: familyId,
      name, description, due_date: dueDate, priority,
      status: 'new', sort_order: sortOrder,
      created_at: new Date().toISOString(),
    }

    setTasks(prev => [...prev, temp])
    setShowAddSheet(false)

    const { data, error } = await supabase
      .from('tasks')
      .insert({ family_id: familyId, name, description, due_date: dueDate, priority, sort_order: sortOrder })
      .select().single()

    if (error) {
      console.error('Insert error:', error)
      setTasks(prev => prev.filter(t => t.id !== tempId))
    } else {
      setTasks(prev => prev.map(t => t.id === tempId ? (data as Task) : t))
    }
  }

  async function handleToggleStatus(item: Task) {
    const nextStatus: TaskStatus = item.status === 'done' ? 'new' : 'done'
    setTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: nextStatus } : t))
    const { error } = await supabase.from('tasks').update({ status: nextStatus }).eq('id', item.id)
    if (error) {
      console.error('Toggle error:', error)
      setTasks(prev => prev.map(t => t.id === item.id ? { ...t, status: item.status } : t))
    }
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) console.error('Delete error:', error)
  }

  async function handleSaveEdit(id: string, name: string, description: string | null, dueDate: string | null, priority: TaskPriority, status: TaskStatus) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, name, description, due_date: dueDate, priority, status } : t))
    await supabase.from('tasks').update({ name, description, due_date: dueDate, priority, status }).eq('id', id)
  }

  async function handleStatusChange(id: string, newStatus: TaskStatus) {
    const prev = tasks.find(t => t.id === id)
    if (!prev || prev.status === newStatus) return

    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: newStatus } : t))
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    if (error) {
      console.error('Status change error:', error)
      setTasks(ts => ts.map(t => t.id === id ? { ...t, status: prev.status } : t))
    }
  }

  // ── DnD Handlers ────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeTask = tasks.find(t => t.id === active.id)
    const overColumn = getColumnFromOverId(over.id, tasks)

    if (activeTask && overColumn && activeTask.status !== overColumn) {
      setTasks(prev => prev.map(t =>
        t.id === activeTask.id ? { ...t, status: overColumn } : t
      ))
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const draggedId = activeId
    setActiveId(null)

    if (!draggedId) return
    const task = tasks.find(t => t.id === draggedId)
    if (!task) return

    // Persist status change
    handleStatusChange(draggedId, task.status)
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  // ── Render ──────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-3 p-8 pt-16 text-center">
      <AlertCircle className="size-10 text-destructive" />
      <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
    </div>
  )

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 pt-5 pb-8 sm:px-6">

        {/* ── Header: Toggle + Add button ──────────────────────── */}
        <div className="mb-5 flex items-center gap-4">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button onClick={() => setShowAddSheet(true)}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-primary px-5
                       text-sm font-semibold text-primary-foreground
                       hover:opacity-85 active:scale-95 transition shrink-0">
            <Plus className="size-4" /> Задача
          </button>
        </div>

        {/* ── Content area ─────────────────────────────────────── */}
        {totalCount === 0 ? (
          <EmptyState onCreate={() => setShowAddSheet(true)} />
        ) : viewMode === 'list' ? (
          /* ── LIST VIEW ─────────────────────────────────────── */
          <div>
            {STATUSES.map(status => (
              <StatusSection
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                collapsed={collapsedSections[status]}
                onToggleCollapse={() => setCollapsedSections(prev => ({ ...prev, [status]: !prev[status] }))}
                onToggle={handleToggleStatus}
                onEdit={setEditingItem}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          /* ── KANBAN VIEW ───────────────────────────────────── */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4
                            sm:grid sm:grid-cols-4 sm:overflow-x-visible
                            snap-x snap-mandatory sm:snap-none
                            [&::-webkit-scrollbar]:hidden"
                 style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {STATUSES.map(status => (
                <div key={status} className="w-[300px] shrink-0 snap-start sm:w-auto">
                  <KanbanColumn
                    status={status}
                    tasks={tasksByStatus[status]}
                    onToggle={handleToggleStatus}
                    onEdit={setEditingItem}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeTask && (
                <div className="w-[260px]">
                  <TaskCard
                    item={activeTask}
                    onToggle={() => {}} onEdit={() => {}} onDelete={() => {}}
                    isDragging
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddSheet && (
          <AddTaskSheet
            key="add"
            onAdd={handleAdd}
            onClose={() => setShowAddSheet(false)}
          />
        )}
        {editingItem && (
          <EditDialog
            key="edit"
            item={editingItem}
            onSave={(name, description, dueDate, priority, status) => handleSaveEdit(editingItem.id, name, description, dueDate, priority, status)}
            onClose={() => setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
