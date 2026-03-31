'use client'

import { useState, useEffect, useCallback } from 'react'
import { projectService, type ProjectListItem } from '../services/project-service'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProjects = useCallback(async () => {
    try {
      const data = await projectService.list()
      setProjects(data.projects)
    } catch (err) {
      console.error('Fetch projects error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const deleteProject = useCallback(async (id: string) => {
    await projectService.delete(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }, [])

  return { projects, loading, deleteProject, fetchProjects }
}
