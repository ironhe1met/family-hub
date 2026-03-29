export interface PurchaseItem {
  id: string
  name: string
  quantity: string | null
  isBought: boolean
  sortOrder: number
}

export interface PurchaseList {
  id: string
  name: string
  sortOrder: number
  items: PurchaseItem[]
  itemCount: number
  boughtCount: number
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

export const purchaseService = {
  getLists: () => fetchJSON<{ lists: PurchaseList[] }>(`${API}/purchase-lists`),

  createList: (name: string) =>
    fetchJSON<PurchaseList>(`${API}/purchase-lists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  renameList: (id: string, name: string) =>
    fetchJSON<{ ok: true }>(`${API}/purchase-lists/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }),

  deleteList: (id: string) =>
    fetchJSON<null>(`${API}/purchase-lists/${id}`, { method: 'DELETE' }),

  addItem: (listId: string, name: string, quantity?: string) =>
    fetchJSON<PurchaseItem>(`${API}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listId, name, quantity }),
    }),

  updateItem: (id: string, data: Partial<PurchaseItem>) =>
    fetchJSON<{ ok: true }>(`${API}/purchases/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  toggleItem: (id: string, isBought: boolean) =>
    fetchJSON<{ id: string; isBought: boolean }>(`${API}/purchases/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBought }),
    }),

  deleteItem: (id: string) =>
    fetchJSON<null>(`${API}/purchases/${id}`, { method: 'DELETE' }),
}
