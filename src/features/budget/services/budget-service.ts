export interface BudgetCategory {
  id: string; name: string; type: 'income' | 'expense' | 'exchange'; icon: string | null; color: string | null; isDefault: boolean
}

export interface BudgetTransaction {
  id: string; type: 'income' | 'expense'; amount: number; currency: string
  description: string | null; exchangeId: string | null
  category: { id: string; name: string; icon: string | null }
  user: { id: string; firstName: string }; date: string; createdAt: string
}

export interface CurrencySummary {
  currency: string; income: number; expense: number; balance: number
}

export interface BudgetSummary {
  period: string
  monthByCurrency: CurrencySummary[]
  totalByCurrency: { currency: string; balance: number }[]
  byCategory: { categoryId: string; categoryName: string; type: string; currency: string; total: number }[]
}

export interface BudgetRecurring {
  id: string; title: string; amount: number; currency: string; period: string
  nextDate: string; isActive: boolean; category: { id: string; name: string; icon: string | null }
}

export interface BudgetPlanned {
  id: string; title: string; amount: number; currency: string
  targetDate: string | null; isCompleted: boolean
  category: { id: string; name: string; icon: string | null } | null
}

export interface Asset {
  id: string; name: string; amount: number; currency: string; icon: string | null
}

const API = '/api/v1/budget'

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || `HTTP ${res.status}`) }
  if (res.status === 204) return null as T
  return res.json()
}

export const budgetService = {
  summary: (month?: string) => fetchJSON<BudgetSummary>(`${API}/summary${month ? `?month=${month}` : ''}`),

  // Transactions
  listTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return fetchJSON<{ transactions: BudgetTransaction[]; total: number }>(`${API}/transactions${qs}`)
  },
  createTransaction: (data: { type: string; amount: number; categoryId: string; date: string; description?: string; currency?: string }) =>
    fetchJSON<{ transaction: BudgetTransaction }>(`${API}/transactions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => fetchJSON<null>(`${API}/transactions/${id}`, { method: 'DELETE' }),

  // Categories
  listCategories: () => fetchJSON<{ categories: BudgetCategory[] }>(`${API}/categories`),
  createCategory: (data: { name: string; type: string; icon?: string }) =>
    fetchJSON<{ category: BudgetCategory }>(`${API}/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteCategory: (id: string) => fetchJSON<null>(`${API}/categories/${id}`, { method: 'DELETE' }),

  // Recurring
  listRecurring: () => fetchJSON<{ recurring: BudgetRecurring[] }>(`${API}/recurring`),
  createRecurring: (data: { title: string; amount: number; categoryId: string; period: string; nextDate: string }) =>
    fetchJSON<{ recurring: BudgetRecurring }>(`${API}/recurring`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  payRecurring: (id: string) => fetchJSON<{ transaction: BudgetTransaction; nextDate: string }>(`${API}/recurring/${id}/pay`, { method: 'POST' }),
  deleteRecurring: (id: string) => fetchJSON<null>(`${API}/recurring/${id}`, { method: 'DELETE' }),

  // Planned
  listPlanned: () => fetchJSON<{ planned: BudgetPlanned[] }>(`${API}/planned`),
  createPlanned: (data: { title: string; amount: number; categoryId?: string; targetDate?: string }) =>
    fetchJSON<{ planned: BudgetPlanned }>(`${API}/planned`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  completePlanned: (id: string, actualAmount?: number) =>
    fetchJSON<{ transaction: BudgetTransaction }>(`${API}/planned/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actualAmount }) }),
  deletePlanned: (id: string) => fetchJSON<null>(`${API}/planned/${id}`, { method: 'DELETE' }),

  // Assets
  listAssets: () => fetchJSON<{ assets: Asset[] }>(`${API}/assets`),
  createAsset: (data: { name: string; amount: number; currency?: string; icon?: string }) =>
    fetchJSON<{ asset: Asset }>(`${API}/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateAsset: (id: string, data: { name?: string; amount?: number; currency?: string }) =>
    fetchJSON<{ asset: Asset }>(`${API}/assets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteAsset: (id: string) => fetchJSON<null>(`${API}/assets/${id}`, { method: 'DELETE' }),

  // Exchange
  createExchange: (data: { fromCurrency: string; fromAmount: number; toCurrency: string; toAmount: number; date?: string; description?: string }) =>
    fetchJSON<{ exchange: { exchangeId: string; from: { id: string; currency: string; amount: number }; to: { id: string; currency: string; amount: number }; rate: number; date: string } }>(`${API}/exchange`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
}
