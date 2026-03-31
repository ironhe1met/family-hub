'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, List, ListChecks, Users, Settings2, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { useTasks } from '@/features/tasks/hooks/use-tasks'
import { taskListService } from '@/features/tasks/services/task-service'
import { KanbanBoard } from '@/features/tasks/components/kanban-board'
import { TaskListView } from '@/features/tasks/components/task-list-view'
import type { Task } from '@/features/tasks/services/task-service'

type ViewMode = 'kanban' | 'list'

interface FamilyMember {
  id: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
}

export default function TasksPage() {
  const router = useRouter()
  const { tasks, taskLists, loading, deleteTask, toggleStatus, changeStatus, fetchTasks } = useTasks()
  const confirm = useConfirm()
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])

  useEffect(() => {
    fetch('/api/v1/family/members')
      .then((r) => r.json())
      .then((d) => setFamilyMembers(d.members || []))
      .catch(() => {})
  }, [])

  const [view, setView] = useState<ViewMode>('kanban')
  const [filterMemberId, setFilterMemberId] = useState<string>('')
  const [showListManager, setShowListManager] = useState(false)
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editListName, setEditListName] = useState('')
  const [newListName, setNewListName] = useState('')
  const listManagerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showListManager) return
    function handleClick(e: MouseEvent) {
      if (listManagerRef.current && !listManagerRef.current.contains(e.target as Node)) {
        setShowListManager(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showListManager])

  const filteredTasks = filterMemberId
    ? tasks.filter((t) => t.assignedTo?.id === filterMemberId)
    : tasks

  function handleOpenTask(task: Task) {
    router.push(`/tasks/${task.id}`)
  }

  async function handleDelete(id: string) {
    if (await confirm({ message: 'Ви впевнені, що хочете видалити задачу?' })) deleteTask(id)
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Задачі</h1>
          <div className="relative" ref={listManagerRef}>
            <button
              onClick={() => setShowListManager(!showListManager)}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container"
              title="Керування списками"
            >
              <Settings2 className="size-4" />
            </button>

            {showListManager && (
              <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-outline-variant/30 bg-surface-container p-3 shadow-xl">
                <h3 className="mb-2 text-sm font-medium text-foreground">Списки задач</h3>
                <div className="space-y-1.5">
                  {taskLists.map((list) => (
                    <div key={list.id} className="flex items-center gap-2">
                      {editingListId === list.id ? (
                        <>
                          <input
                            value={editListName}
                            onChange={(e) => setEditListName(e.target.value)}
                            autoFocus
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter' && editListName.trim()) { await taskListService.update(list.id, editListName.trim()); setEditingListId(null); fetchTasks() }
                              if (e.key === 'Escape') setEditingListId(null)
                            }}
                            className="h-8 flex-1 rounded-md border border-primary bg-surface-container-high px-2 text-sm focus:outline-none"
                          />
                          <button onClick={async () => { if (editListName.trim()) { await taskListService.update(list.id, editListName.trim()); setEditingListId(null); fetchTasks() } }} className="text-primary"><Check className="size-4" /></button>
                          <button onClick={() => setEditingListId(null)} className="text-muted-foreground"><X className="size-4" /></button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-foreground">{list.name}</span>
                          <span className="text-xs text-muted-foreground">{list.taskCount}</span>
                          <button onClick={() => { setEditingListId(list.id); setEditListName(list.name) }} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-surface-container-high"><Pencil className="size-3" /></button>
                          <button onClick={async () => { if (await confirm({ message: `Ви впевнені, що хочете видалити список "${list.name}"?` })) { await taskListService.delete(list.id); fetchTasks() } }} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3" /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Новий список..."
                    onKeyDown={async (e) => { if (e.key === 'Enter' && newListName.trim()) { await taskListService.create(newListName.trim()); setNewListName(''); fetchTasks() } }}
                    className="h-8 flex-1 rounded-md border border-outline/30 bg-surface-container-high px-2 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                  />
                  <button onClick={async () => { if (newListName.trim()) { await taskListService.create(newListName.trim()); setNewListName(''); fetchTasks() } }} className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary"><Plus className="size-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-9 rounded-md border border-outline-variant/30">
          <button onClick={() => setView('kanban')} className={cn('flex items-center gap-1.5 px-3 text-sm transition-colors', view === 'kanban' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
            <LayoutGrid className="size-4" /> Kanban
          </button>
          <button onClick={() => setView('list')} className={cn('flex items-center gap-1.5 px-3 text-sm transition-colors', view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground')}>
            <List className="size-4" /> Список
          </button>
        </div>
      </div>

      {/* People filter */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto">
        <button onClick={() => setFilterMemberId('')} className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors', !filterMemberId ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>
          <Users className="size-4" /> Всі задачі
        </button>
        {familyMembers.map((member) => {
          const count = tasks.filter((t) => t.assignedTo?.id === member.id).length
          return (
            <button key={member.id} onClick={() => setFilterMemberId(member.id)} className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors', filterMemberId === member.id ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">{member.firstName[0]}</span>
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
          <button onClick={() => router.push('/tasks/new')} className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90">Створити задачу</button>
        </div>
      )}

      {filteredTasks.length === 0 && tasks.length > 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">Немає задач для цього фільтра</div>
      )}

      {/* Content */}
      {filteredTasks.length > 0 && view === 'kanban' && (
        <KanbanBoard tasks={filteredTasks} onToggle={toggleStatus} onEdit={handleOpenTask} onDelete={handleDelete} onStatusChange={changeStatus} />
      )}

      {filteredTasks.length > 0 && view === 'list' && (
        <TaskListView tasks={filteredTasks} onToggle={toggleStatus} onEdit={handleOpenTask} onDelete={handleDelete} />
      )}

      {/* FAB */}
      <button
        onClick={() => router.push('/tasks/new')}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90"
      >
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}
