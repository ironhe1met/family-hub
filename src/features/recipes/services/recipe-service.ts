export interface RecipeIngredient {
  id: string
  name: string
  quantity: string | null
  sortOrder: number
}

export interface RecipeListItem {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  ingredientCount: number
  createdBy: { id: string; firstName: string; avatarUrl: string | null }
  createdAt: string
}

export interface Recipe {
  id: string
  title: string
  description: string | null
  instructions: string | null
  imageUrl: string | null
  ingredients: RecipeIngredient[]
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

export const recipeService = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchJSON<{ recipes: RecipeListItem[]; total: number }>(`${API}/recipes${qs}`)
  },

  getById: (id: string) =>
    fetchJSON<{ recipe: Recipe }>(`${API}/recipes/${id}`),

  create: (data: { title: string; description?: string; instructions?: string; ingredients?: { name: string; quantity?: string }[] }) =>
    fetchJSON<{ recipe: Recipe }>(`${API}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { title?: string; description?: string; instructions?: string; ingredients?: { name: string; quantity?: string }[] }) =>
    fetchJSON<{ recipe: Recipe }>(`${API}/recipes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchJSON<null>(`${API}/recipes/${id}`, { method: 'DELETE' }),

  uploadImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('image', file)
    return fetchJSON<{ imageUrl: string }>(`${API}/recipes/${id}/image`, { method: 'POST', body: form })
  },

  toPurchases: (id: string, purchaseListId: string) =>
    fetchJSON<{ addedCount: number }>(`${API}/recipes/${id}/to-purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseListId }),
    }),
}
