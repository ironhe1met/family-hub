'use client'

import { useState, useEffect, useCallback } from 'react'
import { ideaService, type Idea } from '../services/idea-service'

export function useIdea(id: string) {
  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ideaService.getById(id).then((data) => {
      setIdea(data.idea)
    }).catch(console.error).finally(() => setLoading(false))
  }, [id])

  const updateIdea = useCallback(async (data: { title?: string; description?: string }) => {
    const { idea: updated } = await ideaService.update(id, data)
    setIdea(updated)
    return updated
  }, [id])

  const deleteIdea = useCallback(async () => {
    await ideaService.delete(id)
  }, [id])

  const convertIdea = useCallback(async (type: 'task' | 'project') => {
    const result = await ideaService.convert(id, type)
    setIdea((prev) => prev ? { ...prev, convertedToType: result.convertedToType, convertedToId: result.convertedToId } : prev)
    return result
  }, [id])

  return { idea, loading, updateIdea, deleteIdea, convertIdea }
}
