'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskCard } from './task-card'
import type { Task } from '../services/task-service'

const sections = [
  { status: 'new', label: 'Нові' },
  { status: 'in_progress', label: 'В роботі' },
  { status: 'done', label: 'Виконані' },
  { status: 'archived', label: 'Архів' },
]

interface TaskListViewProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export function TaskListView({ tasks, onToggle, onEdit, onDelete }: TaskListViewProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ archived: true })

  const tasksByStatus = useMemo(() => {
    const result: Record<string, Task[]> = {}
    for (const task of tasks) {
      if (!result[task.status]) result[task.status] = []
      result[task.status].push(task)
    }
    // Sort: tasks with date first (by date asc), without date — below
    for (const key of Object.keys(result)) {
      result[key].sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        if (a.dueDate && !b.dueDate) return -1
        if (!a.dueDate && b.dueDate) return 1
        return a.sortOrder - b.sortOrder
      })
    }
    return result
  }, [tasks])

  function toggleSection(status: string) {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }))
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const sectionTasks = tasksByStatus[section.status] || []
        if (sectionTasks.length === 0) return null
        const isCollapsed = collapsed[section.status]

        return (
          <div key={section.status}>
            <button
              onClick={() => toggleSection(section.status)}
              className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"
            >
              {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronDown className="size-4" />}
              {section.label}
              <span className="rounded-sm bg-surface-container px-1.5 py-0.5 text-xs text-muted-foreground">
                {sectionTasks.length}
              </span>
            </button>

            {!isCollapsed && (
              <div className="space-y-2">
                {sectionTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {tasks.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">Задач поки немає</p>
        </div>
      )}
    </div>
  )
}
