'use client'

import { useState } from 'react'
import { LayoutGrid, List, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import { KanbanBoard } from '@/features/tasks/components/kanban-board'
import { TaskListView } from '@/features/tasks/components/task-list-view'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import type { Task } from '@/features/tasks/services/task-service'

type ViewMode = 'kanban' | 'list'

export default function TasksPage() {
  const { tasks, taskLists, loading, createTask, updateTask, deleteTask, toggleStatus, changeStatus } = useTasks()
  const [view, setView] = useState<ViewMode>('kanban')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  async function handleSave(data: Record<string, unknown>) {
    if (editingTask) {
      await updateTask(editingTask.id, data)
    } else {
      await createTask(data as Parameters<typeof createTask>[0])
    }
  }

  function handleDelete(id: string) {
    if (confirm('Видалити задачу?')) {
      deleteTask(id)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-surface-container" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 min-w-[280px] flex-1 animate-pulse rounded-md bg-surface-container/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Задачі</h1>

        {/* View toggle */}
        <div className="flex h-9 rounded-md border border-outline-variant/30">
          <button
            onClick={() => setView('kanban')}
            className={cn(
              'flex items-center gap-1.5 px-3 text-sm transition-colors',
              view === 'kanban' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            )}
          >
            <LayoutGrid className="size-4" />
            Kanban
          </button>
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 px-3 text-sm transition-colors',
              view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
            )}
          >
            <List className="size-4" />
            Список
          </button>
        </div>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ListChecks className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Задач поки немає</h2>
          <p className="mt-1 text-sm text-muted-foreground">Створіть першу задачу</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90"
          >
            Створити задачу
          </button>
        </div>
      )}

      {/* Content */}
      {tasks.length > 0 && view === 'kanban' && (
        <KanbanBoard
          tasks={tasks}
          onToggle={toggleStatus}
          onEdit={setEditingTask}
          onDelete={handleDelete}
          onStatusChange={changeStatus}
        />
      )}

      {tasks.length > 0 && view === 'list' && (
        <TaskListView
          tasks={tasks}
          onToggle={toggleStatus}
          onEdit={setEditingTask}
          onDelete={handleDelete}
        />
      )}

      {/* FAB override — create task */}
      {tasks.length > 0 && (
        <button
          onClick={() => setShowCreate(true)}
          className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90"
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Task form dialog */}
      {(showCreate || editingTask) && (
        <TaskFormDialog
          task={editingTask}
          taskLists={taskLists}
          onSave={handleSave}
          onClose={() => { setShowCreate(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
