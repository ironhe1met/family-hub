'use client'

import { useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
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

function SortableCard({ task, onToggle, onEdit, onDelete }: { task: Task; onToggle: (id: string) => void; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
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

    // If dropping over a column header
    const targetColumn = columns.find((c) => c.id === overId)
    if (targetColumn) {
      const task = tasks.find((t) => t.id === activeId)
      if (task && task.status !== targetColumn.id) {
        onStatusChange(activeId, targetColumn.id as Task['status'])
      }
      return
    }

    // If dropping over another task
    const overTask = tasks.find((t) => t.id === overId)
    const activeTask = tasks.find((t) => t.id === activeId)
    if (overTask && activeTask && overTask.status !== activeTask.status) {
      onStatusChange(activeId, overTask.status)
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null)
    // Status already changed in handleDragOver
    void event
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
        {columns.map((col) => {
          const colTasks = tasksByStatus[col.id] || []
          return (
            <div key={col.id} className={cn('min-w-[280px] flex-1 rounded-md border-t-2 bg-surface-container/30 p-2', col.color)}>
              {/* Column header */}
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-sm font-medium text-foreground">{col.label}</h3>
                <span className="rounded-sm bg-surface-container px-1.5 py-0.5 text-xs text-muted-foreground">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <SortableContext items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy} id={col.id}>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <SortableCard key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              </SortableContext>

              {colTasks.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground/50">
                  Порожньо
                </div>
              )}
            </div>
          )
        })}
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
