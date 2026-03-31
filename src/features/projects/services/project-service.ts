export interface ProjectItem {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'done'
  estimatedCost: number | null
  currency: string
  url: string | null
  sortOrder: number
  createdAt: string
}

export interface ProjectListItem {
  id: string
  title: string
  description: string | null
  status: string
  itemCount: number
  itemDoneCount: number
  taskCount: number
  taskDoneCount: number
  totalCost: number
  currency: string
  createdBy: { id: string; firstName: string; avatarUrl: string | null }
  createdAt: string
}

export interface ProjectTask {
  id: string
  title: string
  status: string
  priority: string
  assignedTo: { id: string; firstName: string; avatarUrl: string | null } | null
  dueDate: string | null
}

export interface Project {
  id: string
  title: string
  description: string | null
  status: string
  items: ProjectItem[]
  tasks: ProjectTask[]
  totalCost: number
  completedCost: number
  createdBy: { id: string; firstName: string; avatarUrl: string | null }
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

export const projectService = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchJSON<{ projects: ProjectListItem[]; total: number }>(`${API}/projects${qs}`)
  },

  getById: (id: string) => fetchJSON<{ project: Project }>(`${API}/projects/${id}`),

  create: (data: { title: string; description?: string }) =>
    fetchJSON<{ project: Project }>(`${API}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string; status?: string }) =>
    fetchJSON<{ project: Project }>(`${API}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) => fetchJSON<null>(`${API}/projects/${id}`, { method: 'DELETE' }),

  addItem: (projectId: string, data: { title: string; estimatedCost?: number; currency?: string; url?: string }) =>
    fetchJSON<{ item: ProjectItem }>(`${API}/projects/${projectId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  updateItem: (projectId: string, itemId: string, data: Partial<ProjectItem>) =>
    fetchJSON<{ item: ProjectItem }>(`${API}/projects/${projectId}/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteItem: (projectId: string, itemId: string) =>
    fetchJSON<null>(`${API}/projects/${projectId}/items/${itemId}`, { method: 'DELETE' }),
}
