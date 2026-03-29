'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import { TaskCard } from './task-card'
import type { Task } from '../services/task-service'

const columns = [
  { id: 'new', label: 'Нові', color: 'border-t-primary' },
  { id: 'in_progress', label: 'В роботі', color: 'border-t-warning' },
  { id: 'done', label: 'Виконані', color: 'border-t-success' },
  { id: 'archived', label: 'Архів', color: 'border-t-muted-foreground' },
]

interface KanbanBoardProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: Task['status']) => void
}

function DroppableColumn({ id, label, color, tasks, onToggle, onEdit, onDelete }: {
  id: string
  label: string
  color: string
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] flex-1 rounded-md border-t-2 p-2 transition-colors',
        color,
        isOver ? 'bg-primary/10' : 'bg-surface-container/30'
      )}
    >
      {/* Column header */}
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <span className="rounded-sm bg-surface-container px-1.5 py-0.5 text-xs text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <DraggableCard key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="py-8 text-center text-xs text-muted-foreground/50">
          Порожньо
        </div>
      )}
    </div>
  )
}

function DraggableCard({ task, onToggle, onEdit, onDelete }: {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}) {
  const { setNodeRef, listeners, attributes, isDragging, transform } = useDraggable({ id: task.id })

  const style = {
    opacity: isDragging ? 0.3 : 1,
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="cursor-grab active:cursor-grabbing"
    >
      <TaskCard task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} compact />
    </div>
  )
}

export function KanbanBoard({ tasks, onToggle, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  const tasksByStatus = useMemo(() => {
    const result: Record<string, Task[]> = { new: [], in_progress: [], done: [], archived: [] }
    for (const task of tasks) {
      if (result[task.status]) result[task.status].push(task)
    }
    return result
  }, [tasks])

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which column we're over
    let targetStatus: string | null = null

    // Dropping over a column directly
    if (columns.find((c) => c.id === overId)) {
      targetStatus = overId
    } else {
      // Dropping over a task — find that task's status
      const overTask = tasks.find((t) => t.id === overId)
      if (overTask) targetStatus = overTask.status
    }

    if (targetStatus) {
      const draggedTask = tasks.find((t) => t.id === activeId)
      if (draggedTask && draggedTask.status !== targetStatus) {
        onStatusChange(activeId, targetStatus as Task['status'])
      }
    }
  }

  function handleDragEnd(_event: DragEndEvent) {
    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <DroppableColumn
            key={col.id}
            id={col.id}
            label={col.label}
            color={col.color}
            tasks={tasksByStatus[col.id] || []}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-[2deg] shadow-xl">
            <TaskCard task={activeTask} onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} compact />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
