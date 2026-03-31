'use client'

import { useState, useEffect, useCallback } from 'react'
import { projectService, type Project, type ProjectItem, type ProjectTask } from '../services/project-service'

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectService.getById(id)
      .then((data) => setProject(data.project))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateProject = useCallback(async (data: Parameters<typeof projectService.update>[1]) => {
    const { project: updated } = await projectService.update(id, data)
    setProject((prev) => prev ? { ...prev, ...updated } : prev)
    return updated
  }, [id])

  const deleteProject = useCallback(async () => {
    await projectService.delete(id)
  }, [id])

  const addItem = useCallback(async (data: Parameters<typeof projectService.addItem>[1]) => {
    const { item } = await projectService.addItem(id, data)
    setProject((prev) => {
      if (!prev) return prev
      const items = [...prev.items, item]
      const totalCost = items.reduce((s, i) => s + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
      return { ...prev, items, totalCost }
    })
  }, [id])

  const updateItem = useCallback(async (itemId: string, data: Partial<ProjectItem>) => {
    const { item } = await projectService.updateItem(id, itemId, data)
    setProject((prev) => {
      if (!prev) return prev
      const items = prev.items.map((i) => i.id === itemId ? { ...i, ...item } : i)
      const totalCost = items.reduce((s, i) => s + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
      const completedCost = items.filter((i) => i.status === 'done').reduce((s, i) => s + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
      return { ...prev, items, totalCost, completedCost }
    })
  }, [id])

  const deleteItem = useCallback(async (itemId: string) => {
    await projectService.deleteItem(id, itemId)
    setProject((prev) => {
      if (!prev) return prev
      const items = prev.items.filter((i) => i.id !== itemId)
      const totalCost = items.reduce((s, i) => s + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
      const completedCost = items.filter((i) => i.status === 'done').reduce((s, i) => s + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
      return { ...prev, items, totalCost, completedCost }
    })
  }, [id])

  // Project tasks (linked via projectId)
  const addProjectTask = useCallback(async (title: string) => {
    const res = await fetch('/api/v1/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, projectId: id }),
    })
    const { task } = await res.json()
    setProject((prev) => prev ? { ...prev, tasks: [...prev.tasks, task] } : prev)
    return task
  }, [id])

  const removeProjectTask = useCallback(async (taskId: string) => {
    await fetch(`/api/v1/tasks/${taskId}`, { method: 'DELETE' })
    setProject((prev) => prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev)
  }, [])

  return { project, loading, updateProject, deleteProject, addItem, updateItem, deleteItem, addProjectTask, removeProjectTask }
}
