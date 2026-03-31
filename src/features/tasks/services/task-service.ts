export interface TaskUser {
  id: string
  firstName: string
  avatarUrl: string | null
}

export interface TaskTag {
  id: string
  name: string
  color: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: 'new' | 'in_progress' | 'done' | 'archived'
  priority: 'high' | 'medium' | 'low'
  dueDate: string | null
  dueTime: string | null
  listId: string | null
  sprintId: string | null
  projectId: string | null
  createdBy: TaskUser
  assignedTo: TaskUser | null
  tags: TaskTag[]
  subtaskCount: number
  subtaskDoneCount: number
  commentCount: number
  isRecurring: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface TaskInput {
  title?: string
  description?: string | null
  status?: string
  priority?: string
  dueDate?: string | null
  dueTime?: string | null
  listId?: string | null
  sprintId?: string | null
  projectId?: string | null
  assignedTo?: string | null
  tagIds?: string[]
}

export interface TaskList {
  id: string
  name: string
  sortOrder: number
  taskCount: number
}

export interface Subtask {
  id: string
  title: string
  isDone: boolean
  sortOrder: number
}

export interface Comment {
  id: string
  content: string
  user: TaskUser
  createdAt: string
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

// Tasks
export const taskService = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchJSON<{ tasks: Task[]; total: number }>(`${API}/tasks${qs}`)
  },

  get: (id: string) => fetchJSON<Task & { subtasks: Subtask[]; comments: Comment[] }>(`${API}/tasks/${id}`),

  create: (data: TaskInput & { title: string }) =>
    fetchJSON<{ task: Task }>(`${API}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: TaskInput) =>
    fetchJSON<{ task: Task }>(`${API}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJSON<null>(`${API}/tasks/${id}`, { method: 'DELETE' }),

  updateStatus: (id: string, status: string) =>
    fetchJSON<{ id: string; status: string }>(`${API}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),

  reorder: (updates: { id: string; sortOrder: number; status?: string }[]) =>
    fetchJSON<null>(`${API}/tasks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    }),

  // Subtasks
  addSubtask: (taskId: string, title: string) =>
    fetchJSON<Subtask>(`${API}/tasks/${taskId}/subtasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }),

  updateSubtask: (taskId: string, subtaskId: string, data: Partial<Subtask>) =>
    fetchJSON<Subtask>(`${API}/tasks/${taskId}/subtasks/${subtaskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  deleteSubtask: (taskId: string, subtaskId: string) =>
    fetchJSON<null>(`${API}/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' }),

  // Comments
  addComment: (taskId: string, content: string) =>
    fetchJSON<Comment>(`${API}/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),

  updateComment: (taskId: string, commentId: string, content: string) =>
    fetchJSON<Comment>(`${API}/tasks/${taskId}/comments/${commentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }),

  deleteComment: (taskId: string, commentId: string) =>
    fetchJSON<null>(`${API}/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
}

// Task Lists
export const taskListService = {
  list: () => fetchJSON<{ lists: TaskList[] }>(`${API}/task-lists`),

  create: (name: string) =>
    fetchJSON<TaskList>(`${API}/task-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  update: (id: string, name: string) =>
    fetchJSON<{ ok: true }>(`${API}/task-lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  delete: (id: string) =>
    fetchJSON<null>(`${API}/task-lists/${id}`, { method: 'DELETE' }),
}
