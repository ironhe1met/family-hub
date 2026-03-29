export interface Idea {
  id: string
  title: string
  description: string | null
  createdBy: { id: string; firstName: string; avatarUrl: string | null }
  tags: { id: string; name: string; color: string | null }[]
  convertedToType: string | null
  convertedToId: string | null
  createdAt: string
  updatedAt: string
}

const API = '/api/v1'

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as T
  return res.json()
}

export const ideaService = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchJSON<{ ideas: Idea[]; total: number }>(`${API}/ideas${qs}`)
  },

  create: (data: { title: string; description?: string; tagIds?: string[] }) =>
    fetchJSON<{ idea: Idea }>(`${API}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string; tagIds?: string[] }) =>
    fetchJSON<{ idea: Idea }>(`${API}/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJSON<null>(`${API}/ideas/${id}`, { method: 'DELETE' }),

  convert: (id: string, type: 'task' | 'project') =>
    fetchJSON<{ convertedToType: string; convertedToId: string }>(`${API}/ideas/${id}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    }),
}
