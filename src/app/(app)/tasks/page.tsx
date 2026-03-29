'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, List, ListChecks, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import { KanbanBoard } from '@/features/tasks/components/kanban-board'
import { TaskListView } from '@/features/tasks/components/task-list-view'
import { TaskFormDialog } from '@/features/tasks/components/task-form-dialog'
import type { Task } from '@/features/tasks/services/task-service'

type ViewMode = 'kanban' | 'list'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
}

export default function TasksPage() {
  const { tasks, taskLists, loading, createTask, updateTask, deleteTask, toggleStatus, changeStatus, fetchTasks } = useTasks()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    fetch('/api/v1/family/members')
      .then((r) => r.json())
      .then((d) => setFamilyMembers(d.members || []))
      .catch(() => {})
  }, [])

  const [view, setView] = useState<ViewMode>('kanban')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [filterMemberId, setFilterMemberId] = useState<string>('')

  // Filter tasks by assigned member
  const filteredTasks = filterMemberId
    ? tasks.filter((t) => t.assignedTo?.id === filterMemberId)
    : tasks

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

      {/* People filter tabs */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setFilterMemberId('')}
          className={cn(
            'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            !filterMemberId ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container'
          )}
        >
          <Users className="size-4" />
          Всі задачі
        </button>
        {familyMembers.map((member) => {
          const count = tasks.filter((t) => t.assignedTo?.id === member.id).length
          return (
            <button
              key={member.id}
              onClick={() => setFilterMemberId(member.id)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                filterMemberId === member.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container'
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
                {member.firstName[0]}
              </span>
              {member.firstName}
              {count > 0 && <span className="text-xs opacity-60">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && tasks.length === 0 && (
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

      {/* Filtered empty */}
      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Немає задач для цього фільтра
        </div>
      )}

      {/* Content */}
      {filteredTasks.length > 0 && view === 'kanban' && (
        <KanbanBoard
          tasks={filteredTasks}
          onToggle={toggleStatus}
          onEdit={setEditingTask}
          onDelete={handleDelete}
          onStatusChange={changeStatus}
        />
      )}

      {filteredTasks.length > 0 && view === 'list' && (
        <TaskListView
          tasks={filteredTasks}
          onToggle={toggleStatus}
          onEdit={setEditingTask}
          onDelete={handleDelete}
        />
      )}

      {/* FAB — create task */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90"
      >
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {/* Task form dialog */}
      {(showCreate || editingTask) && (
        <TaskFormDialog
          task={editingTask}
          taskLists={taskLists}
          familyMembers={familyMembers}
          onSave={async (data) => { await handleSave(data); await fetchTasks() }}
          onClose={() => { setShowCreate(false); setEditingTask(null) }}
        />
      )}
    </div>
  )
}
