'use client'

import { useState, useEffect, useCallback } from 'react'
import { taskService, taskListService, type Task, type TaskList } from '../services/task-service'

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskLists, setTaskLists] = useState<TaskList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    try {
      const [tasksData, listsData] = await Promise.all([
        taskService.list(),
        taskListService.list(),
      ])
      setTasks(tasksData.tasks)
      setTaskLists(listsData.lists)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const createTask = useCallback(async (data: Parameters<typeof taskService.create>[0]) => {
    const { task } = await taskService.create(data)
    setTasks((prev) => [task, ...prev])
    return task
  }, [])

  const updateTask = useCallback(async (id: string, data: Parameters<typeof taskService.update>[1]) => {
    const { task } = await taskService.update(id, data)
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)))
    return task
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    await taskService.delete(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toggleStatus = useCallback(async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const newStatus = task.status === 'done' ? 'new' : 'done'
    // Optimistic
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus as Task['status'] } : t)))
    try {
      await taskService.updateStatus(id, newStatus)
    } catch {
      // Rollback
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)))
    }
  }, [tasks])

  const changeStatus = useCallback(async (id: string, status: Task['status']) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
    try {
      await taskService.updateStatus(id, status)
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: task.status } : t)))
    }
  }, [tasks])

  const reorderTasks = useCallback(async (updates: { id: string; sortOrder: number; status?: string }[]) => {
    await taskService.reorder(updates)
  }, [])

  return {
    tasks,
    setTasks,
    taskLists,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    changeStatus,
    reorderTasks,
  }
}
