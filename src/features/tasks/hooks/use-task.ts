'use client'

import { useState, useEffect, useCallback } from 'react'
import { taskService, type Task, type Subtask, type Comment } from '../services/task-service'

export interface TaskDetail extends Task {
  subtasks: Subtask[]
  comments: Comment[]
}

export function useTask(id: string) {
  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    taskService.get(id)
      .then((data) => setTask(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateTask = useCallback(async (data: Parameters<typeof taskService.update>[1]) => {
    const { task: updated } = await taskService.update(id, data)
    setTask((prev) => prev ? { ...prev, ...updated } : prev)
    return updated
  }, [id])

  const deleteTask = useCallback(async () => {
    await taskService.delete(id)
  }, [id])

  const updateStatus = useCallback(async (status: string) => {
    await taskService.updateStatus(id, status)
    setTask((prev) => prev ? { ...prev, status: status as Task['status'] } : prev)
  }, [id])

  // Subtasks
  const addSubtask = useCallback(async (title: string) => {
    const subtask = await taskService.addSubtask(id, title)
    setTask((prev) => prev ? {
      ...prev,
      subtasks: [...prev.subtasks, subtask],
      subtaskCount: prev.subtaskCount + 1,
    } : prev)
  }, [id])

  const toggleSubtask = useCallback(async (subtaskId: string) => {
    setTask((prev) => {
      if (!prev) return prev
      const subtasks = prev.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, isDone: !s.isDone } : s
      )
      const subtaskDoneCount = subtasks.filter((s) => s.isDone).length
      return { ...prev, subtasks, subtaskDoneCount }
    })
    const subtask = task?.subtasks.find((s) => s.id === subtaskId)
    if (subtask) {
      await taskService.updateSubtask(id, subtaskId, { isDone: !subtask.isDone })
    }
  }, [id, task?.subtasks])

  const deleteSubtask = useCallback(async (subtaskId: string) => {
    await taskService.deleteSubtask(id, subtaskId)
    setTask((prev) => prev ? {
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== subtaskId),
      subtaskCount: prev.subtaskCount - 1,
      subtaskDoneCount: prev.subtaskDoneCount - (prev.subtasks.find((s) => s.id === subtaskId)?.isDone ? 1 : 0),
    } : prev)
  }, [id])

  // Comments
  const addComment = useCallback(async (content: string) => {
    const comment = await taskService.addComment(id, content)
    setTask((prev) => prev ? {
      ...prev,
      comments: [...prev.comments, comment],
      commentCount: prev.commentCount + 1,
    } : prev)
  }, [id])

  const updateComment = useCallback(async (commentId: string, content: string) => {
    const updated = await taskService.updateComment(id, commentId, content)
    setTask((prev) => prev ? {
      ...prev,
      comments: prev.comments.map((c) => c.id === commentId ? updated : c),
    } : prev)
  }, [id])

  const deleteComment = useCallback(async (commentId: string) => {
    await taskService.deleteComment(id, commentId)
    setTask((prev) => prev ? {
      ...prev,
      comments: prev.comments.filter((c) => c.id !== commentId),
      commentCount: prev.commentCount - 1,
    } : prev)
  }, [id])

  return {
    task, loading,
    updateTask, deleteTask, updateStatus,
    addSubtask, toggleSubtask, deleteSubtask,
    addComment, updateComment, deleteComment,
  }
}
