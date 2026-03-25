export interface Profile {
  id: string
  family_id: string
  display_name: string | null
  created_at: string
}

export interface Purchase {
  id: string
  family_id: string
  list_name: string
  name: string
  quantity: string | null
  is_bought: boolean
  sort_order: number
  created_at: string
}

export type TaskPriority = 'high' | 'medium' | 'low'
export type TaskStatus = 'new' | 'in_progress' | 'done' | 'archived'

export interface Task {
  id: string
  family_id: string
  name: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  sort_order: number
  created_at: string
}

export interface Project {
  id: string
  family_id: string
  name: string
  notes: string | null
  created_at: string
}

export interface ProjectItem {
  id: string
  project_id: string
  family_id: string
  name: string
  status: 'in_progress' | 'done'
  estimated_cost: number | null
  currency: 'UAH' | 'USD' | null
  url: string | null
  created_at: string
}

export interface Idea {
  id: string
  family_id: string
  title: string
  description: string | null
  created_at: string
}
