'use client'

import { useState, useEffect, useCallback } from 'react'
import { ideaService, type Idea } from '../services/idea-service'

export function useIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIdeas = useCallback(async () => {
    try {
      const data = await ideaService.list()
      setIdeas(data.ideas)
    } catch (err) {
      console.error('Fetch ideas error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  const createIdea = useCallback(async (data: { title: string; description?: string }) => {
    const { idea } = await ideaService.create(data)
    setIdeas((prev) => [idea, ...prev])
    return idea
  }, [])

  const updateIdea = useCallback(async (id: string, data: { title?: string; description?: string }) => {
    const { idea } = await ideaService.update(id, data)
    setIdeas((prev) => prev.map((i) => (i.id === id ? idea : i)))
    return idea
  }, [])

  const deleteIdea = useCallback(async (id: string) => {
    await ideaService.delete(id)
    setIdeas((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const convertIdea = useCallback(async (id: string, type: 'task' | 'project') => {
    const result = await ideaService.convert(id, type)
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, convertedToType: result.convertedToType, convertedToId: result.convertedToId } : i)))
    return result
  }, [])

  return { ideas, loading, createIdea, updateIdea, deleteIdea, convertIdea, fetchIdeas }
}
