'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  Wallet, TrendingUp, TrendingDown, ChevronLeft, ChevronRight,
  Plus, Trash2, Check, X, Clock, Target, CreditCard, Settings2,
  Pencil, Landmark, ArrowLeftRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { budgetService, type BudgetSummary, type BudgetTransaction, type BudgetCategory, type BudgetRecurring, type BudgetPlanned, type Asset } from '@/features/budget/services/budget-service'

const CUR_SYM: Record<string, string> = { UAH: '₴', USD: '$', EUR: '€' }
const sym = (c: string) => CUR_SYM[c] || c

type Tab = 'transactions' | 'recurring' | 'planned' | 'assets'

export default function BudgetPage() {
  const confirm = useConfirm()
  const [tab, setTab] = useState<Tab>('transactions')
  const [month, setMonth] = useState(() => format(new Date(), 'yyyy-MM'))

  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [recurring, setRecurring] = useState<BudgetRecurring[]>([])
  const [planned, setPlanned] = useState<BudgetPlanned[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)

  // Transaction form
  const [showAddTx, setShowAddTx] = useState(false)
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCurrency, setTxCurrency] = useState('UAH')
  const [txCategory, setTxCategory] = useState('')
  const [txDesc, setTxDesc] = useState('')
  const [txDate, setTxDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))

  // Edit transaction
  const [editTxId, setEditTxId] = useState<string | null>(null)
  const [editTxAmount, setEditTxAmount] = useState('')
  const [editTxDesc, setEditTxDesc] = useState('')

  // Recurring form
  const [showAddRec, setShowAddRec] = useState(false)
  const [recTitle, setRecTitle] = useState('')
  const [recAmount, setRecAmount] = useState('')
  const [recCategory, setRecCategory] = useState('')
  const [recPeriod, setRecPeriod] = useState('monthly')
  const [recNextDate, setRecNextDate] = useState('')

  // Planned form
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [planTitle, setPlanTitle] = useState('')
  const [planAmount, setPlanAmount] = useState('')
  const [planDate, setPlanDate] = useState('')

  // Assets
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [assetAmount, setAssetAmount] = useState('')
  const [assetCurrency, setAssetCurrency] = useState('UAH')
  const [editAssetId, setEditAssetId] = useState<string | null>(null)
  const [editAssetAmount, setEditAssetAmount] = useState('')

  // Exchange form
  const [showExchange, setShowExchange] = useState(false)
  const [exFromCur, setExFromCur] = useState('UAH')
  const [exFromAmt, setExFromAmt] = useState('')
  const [exToCur, setExToCur] = useState('USD')
  const [exToAmt, setExToAmt] = useState('')
  const [exDate, setExDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [exDesc, setExDesc] = useState('')

  // Category management
  const [showCatManager, setShowCatManager] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense')

  // Filters
  const [filterType, setFilterType] = useState<'' | 'income' | 'expense'>('')
  const [filterCategoryId, setFilterCategoryId] = useState('')

  const fetchAll = useCallback(async () => {
    try {
      const [s, t, c, r, p, a] = await Promise.all([
        budgetService.summary(month), budgetService.listTransactions({ dateFrom: `${month}-01`, dateTo: `${month}-31` }),
        budgetService.listCategories(), budgetService.listRecurring(), budgetService.listPlanned(), budgetService.listAssets(),
      ])
      setSummary(s); setTransactions(t.transactions); setCategories(c.categories)
      setRecurring(r.recurring); setPlanned(p.planned); setAssets(a.assets)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [month])

  useEffect(() => { fetchAll() }, [fetchAll])

  const prevMonth = () => { const d = new Date(`${month}-01`); d.setMonth(d.getMonth() - 1); setMonth(format(d, 'yyyy-MM')) }
  const nextMonth = () => { const d = new Date(`${month}-01`); d.setMonth(d.getMonth() + 1); setMonth(format(d, 'yyyy-MM')) }
  const monthLabel = format(new Date(`${month}-01`), 'LLLL yyyy', { locale: uk })

  const filteredTx = useMemo(() => {
    let list = transactions
    if (filterType) list = list.filter((t) => t.type === filterType)
    if (filterCategoryId) list = list.filter((t) => t.category.id === filterCategoryId)
    return list
  }, [transactions, filterType, filterCategoryId])

  const groupedTx = useMemo(() => {
    const map = new Map<string, BudgetTransaction[]>()
    for (const t of filteredTx) { const k = t.date.slice(0, 10); if (!map.has(k)) map.set(k, []); map.get(k)!.push(t) }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredTx])

  const filteredCategories = categories.filter((c) => c.type === txType)
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  // Capital calculation
  const capitalByCurrency = useMemo(() => {
    const map = new Map<string, number>()
    // Assets
    for (const a of assets) { map.set(a.currency, (map.get(a.currency) || 0) + a.amount) }
    // Budget balance (all time)
    if (summary) {
      for (const b of summary.totalByCurrency) { map.set(b.currency, (map.get(b.currency) || 0) + b.balance) }
    }
    return Array.from(map.entries()).filter(([, v]) => v !== 0).sort((a, b) => a[0] === 'UAH' ? -1 : b[0] === 'UAH' ? 1 : 0)
  }, [assets, summary])

  // ── Handlers ──
  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault(); if (!txAmount || !txCategory) return
    await budgetService.createTransaction({ type: txType, amount: parseFloat(txAmount), categoryId: txCategory, date: txDate, description: txDesc || undefined, currency: txCurrency } as never)
    setShowAddTx(false); setTxAmount(''); setTxDesc(''); fetchAll()
  }
  const handleSaveEditTx = async () => {
    if (!editTxId || !editTxAmount) return
    await fetch(`/api/v1/budget/transactions/${editTxId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: parseFloat(editTxAmount), description: editTxDesc || null }) })
    setEditTxId(null); fetchAll()
  }
  const handleDeleteTx = async (id: string) => { if (!await confirm({ message: 'Видалити транзакцію?' })) return; await budgetService.deleteTransaction(id); fetchAll() }
  const handleAddRec = async (e: React.FormEvent) => {
    e.preventDefault(); if (!recTitle.trim() || !recAmount || !recCategory || !recNextDate) return
    await budgetService.createRecurring({ title: recTitle.trim(), amount: parseFloat(recAmount), categoryId: recCategory, period: recPeriod, nextDate: recNextDate })
    setShowAddRec(false); setRecTitle(''); setRecAmount(''); fetchAll()
  }
  const handlePayRec = async (id: string) => { await budgetService.payRecurring(id); fetchAll() }
  const handleDeleteRec = async (id: string) => { if (!await confirm({ message: 'Видалити регулярний платіж?' })) return; await budgetService.deleteRecurring(id); fetchAll() }
  const handleAddPlan = async (e: React.FormEvent) => {
    e.preventDefault(); if (!planTitle.trim() || !planAmount) return
    await budgetService.createPlanned({ title: planTitle.trim(), amount: parseFloat(planAmount), targetDate: planDate || undefined })
    setShowAddPlan(false); setPlanTitle(''); setPlanAmount(''); fetchAll()
  }
  const handleCompletePlan = async (id: string) => { await budgetService.completePlanned(id); fetchAll() }
  const handleDeletePlan = async (id: string) => { if (!await confirm({ message: 'Видалити заплановану витрату?' })) return; await budgetService.deletePlanned(id); fetchAll() }
  const handleAddAsset = async (e: React.FormEvent) => {
    e.preventDefault(); if (!assetName.trim() || !assetAmount) return
    await budgetService.createAsset({ name: assetName.trim(), amount: parseFloat(assetAmount), currency: assetCurrency })
    setShowAddAsset(false); setAssetName(''); setAssetAmount(''); fetchAll()
  }
  const handleUpdateAssetAmount = async () => { if (!editAssetId || !editAssetAmount) return; await budgetService.updateAsset(editAssetId, { amount: parseFloat(editAssetAmount) }); setEditAssetId(null); fetchAll() }
  const handleDeleteAsset = async (id: string) => { if (!await confirm({ message: 'Видалити актив?' })) return; await budgetService.deleteAsset(id); fetchAll() }
  const handleAddCategory = async (e: React.FormEvent) => { e.preventDefault(); if (!newCatName.trim()) return; await budgetService.createCategory({ name: newCatName.trim(), type: newCatType }); setNewCatName(''); fetchAll() }
  const handleExchange = async (e: React.FormEvent) => {
    e.preventDefault(); if (!exFromAmt || !exToAmt || exFromCur === exToCur) return
    await budgetService.createExchange({ fromCurrency: exFromCur, fromAmount: parseFloat(exFromAmt), toCurrency: exToCur, toAmount: parseFloat(exToAmt), date: exDate, description: exDesc || undefined })
    setShowExchange(false); setExFromAmt(''); setExToAmt(''); setExDesc(''); fetchAll()
  }
  const handleDeleteCategory = async (id: string) => { try { await budgetService.deleteCategory(id); fetchAll() } catch (err: unknown) { alert(err instanceof Error ? err.message : 'Помилка') } }

  if (loading) return <div className="space-y-4"><div className="h-32 animate-pulse rounded-lg bg-surface-container/30" /><div className="h-64 animate-pulse rounded-lg bg-surface-container/30" /></div>

  // UAH month data (primary)
  const uahMonth = summary?.monthByCurrency.find((c) => c.currency === 'UAH')
  const expenseRatio = uahMonth && uahMonth.income > 0 ? Math.min((uahMonth.expense / uahMonth.income) * 100, 100) : 0

  return (
    <div>
      {/* ── Capital + Summary ── */}
      <div className="mb-6 rounded-xl border border-outline-variant/20 bg-surface p-5">
        <h1 className="mb-4 text-2xl font-semibold">Бюджет</h1>

        {/* Total Capital */}
        <div className="mb-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Загальний капітал</div>
          <div className="flex flex-wrap items-baseline gap-4">
            {capitalByCurrency.map(([cur, amount]) => (
              <span key={cur} className={cn('font-bold', cur === 'UAH' ? 'text-2xl text-primary' : 'text-xl text-foreground')}>
                {sym(cur)}{amount.toLocaleString()}
              </span>
            ))}
            {capitalByCurrency.length === 0 && <span className="text-2xl font-bold text-muted-foreground">₴0</span>}
          </div>
        </div>

        {/* Month summary */}
        <div className="border-t border-outline-variant/15 pt-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">За місяць</div>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container"><ChevronLeft className="size-3.5" /></button>
              <span className="min-w-[130px] text-center text-xs font-medium capitalize text-foreground">{monthLabel}</span>
              <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>

          {/* Per-currency month rows */}
          {summary?.monthByCurrency.map((mc) => (
            <div key={mc.currency} className="mb-3">
              {summary.monthByCurrency.length > 1 && <div className="mb-1 text-[10px] font-medium text-muted-foreground">{mc.currency}</div>}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="mb-0.5 text-[10px] text-muted-foreground">Дохід</div>
                  <div className="text-sm font-semibold text-success">{sym(mc.currency)}{mc.income.toLocaleString()}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] text-muted-foreground">Витрати</div>
                  <div className="text-sm font-semibold text-destructive">{sym(mc.currency)}{mc.expense.toLocaleString()}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-[10px] text-muted-foreground">Різниця</div>
                  <div className={cn('text-sm font-semibold', mc.balance >= 0 ? 'text-success' : 'text-destructive')}>{mc.balance >= 0 ? '+' : ''}{sym(mc.currency)}{mc.balance.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Balance bar (UAH) */}
          {uahMonth && uahMonth.income > 0 && (
            <div className="mb-4">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Витрачено {Math.round(expenseRatio)}%</span>
                <span>₴{uahMonth.expense.toLocaleString()} з ₴{uahMonth.income.toLocaleString()}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                <div className={cn('h-full rounded-full transition-all', expenseRatio > 90 ? 'bg-destructive' : expenseRatio > 70 ? 'bg-warning' : 'bg-success')} style={{ width: `${expenseRatio}%` }} />
              </div>
            </div>
          )}

          {/* Category breakdown */}
          {summary && summary.byCategory.filter((c) => c.type === 'expense').length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">По категоріях</div>
              {summary.byCategory.filter((c) => c.type === 'expense').map((c) => {
                const cat = catMap.get(c.categoryId)
                const totalExpForCur = summary.monthByCurrency.find((m) => m.currency === c.currency)?.expense || 1
                const pct = (c.total / totalExpForCur) * 100
                return (
                  <div key={`${c.categoryId}_${c.currency}`}>
                    <div className="mb-0.5 flex items-center justify-between text-xs">
                      <span className="text-foreground">{c.categoryName}</span>
                      <span className="text-muted-foreground">{sym(c.currency)}{c.total.toLocaleString()} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat?.color || 'var(--color-primary)' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 overflow-x-auto">
          {([['transactions', 'Транзакції', CreditCard], ['recurring', 'Регулярні', Clock], ['planned', 'Заплановані', Target], ['assets', 'Активи', Landmark]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)}
              className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium', tab === key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>
              <Icon className="size-4" /> {label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCatManager(!showCatManager)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container" title="Категорії"><Settings2 className="size-4" /></button>
      </div>

      {/* Category manager */}
      {showCatManager && (
        <div className="mb-4 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Категорії</h3>
          <div className="mb-3 grid grid-cols-2 gap-4">
            {['expense', 'income'].map((type) => (
              <div key={type}>
                <div className="mb-2 text-xs font-medium text-muted-foreground">{type === 'expense' ? 'Витрати' : 'Доходи'}</div>
                <div className="space-y-1">
                  {categories.filter((c) => c.type === type).map((c) => (
                    <div key={c.id} className="group flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color || '#94a3b8' }} />
                      <span className="flex-1 text-foreground">{c.name}</span>
                      {!c.isDefault && <button onClick={() => handleDeleteCategory(c.id)} className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3" /></button>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleAddCategory} className="flex items-center gap-2">
            <input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="Нова категорія" className="h-7 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
            <select value={newCatType} onChange={(e) => setNewCatType(e.target.value as 'expense' | 'income')} className="h-7 rounded border border-outline/30 bg-surface-container px-2 text-xs text-foreground"><option value="expense">Витрата</option><option value="income">Дохід</option></select>
            <button type="submit" disabled={!newCatName.trim()} className="flex h-7 w-7 items-center justify-center rounded bg-primary text-on-primary disabled:opacity-30"><Plus className="size-3.5" /></button>
          </form>
        </div>
      )}

      {/* ── Transactions tab ── */}
      {tab === 'transactions' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex gap-1">
              {([['', 'Всі'], ['expense', 'Витрати'], ['income', 'Доходи']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setFilterType(key)} className={cn('rounded-md px-2.5 py-1 text-xs font-medium', filterType === key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-surface-container')}>{label}</button>
              ))}
            </div>
            <select value={filterCategoryId} onChange={(e) => setFilterCategoryId(e.target.value)} className="h-7 rounded border border-outline/30 bg-surface-container px-2 text-xs text-foreground">
              <option value="">Всі категорії</option>{categories.filter((c) => c.type !== 'exchange').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button onClick={() => setShowExchange(!showExchange)} className={cn('flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium', showExchange ? 'bg-violet-500/15 text-violet-400' : 'text-muted-foreground hover:bg-surface-container hover:text-foreground')}><ArrowLeftRight className="size-3.5" /> Обмін</button>
          </div>

          {/* Exchange form */}
          {showExchange && (
            <form onSubmit={handleExchange} className="mb-4 space-y-2 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-violet-400"><ArrowLeftRight className="size-3.5" /> Обмін валют</div>
              <div className="flex items-center gap-2">
                <input value={exFromAmt} onChange={(e) => setExFromAmt(e.target.value)} placeholder="Віддаю" type="number" step="0.01" required className="h-8 w-28 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <select value={exFromCur} onChange={(e) => setExFromCur(e.target.value)} className="h-8 w-16 rounded border border-outline/30 bg-surface-container px-1 text-xs text-foreground"><option value="UAH">₴</option><option value="USD">$</option><option value="EUR">€</option></select>
                <ArrowLeftRight className="size-4 shrink-0 text-muted-foreground" />
                <input value={exToAmt} onChange={(e) => setExToAmt(e.target.value)} placeholder="Отримую" type="number" step="0.01" required className="h-8 w-28 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <select value={exToCur} onChange={(e) => setExToCur(e.target.value)} className="h-8 w-16 rounded border border-outline/30 bg-surface-container px-1 text-xs text-foreground"><option value="UAH">₴</option><option value="USD">$</option><option value="EUR">€</option></select>
              </div>
              {exFromAmt && exToAmt && exFromCur !== exToCur && (
                <div className="text-[10px] text-muted-foreground">
                  Курс: 1 {exToCur} = {(parseFloat(exFromAmt) / parseFloat(exToAmt)).toFixed(2)} {exFromCur}
                </div>
              )}
              <div className="flex gap-2">
                <input value={exDate} onChange={(e) => setExDate(e.target.value)} type="date" className="h-8 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                <input value={exDesc} onChange={(e) => setExDesc(e.target.value)} placeholder="Опис (опціонально)" className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <button type="submit" disabled={!exFromAmt || !exToAmt || exFromCur === exToCur} className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-violet-500 text-white disabled:opacity-30"><Check className="size-3.5" /></button>
                <button type="button" onClick={() => setShowExchange(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
              </div>
            </form>
          )}

          {showAddTx && (
            <form onSubmit={handleAddTx} className="mb-4 space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
              <div className="flex gap-1">
                <button type="button" onClick={() => setTxType('expense')} className={cn('flex-1 rounded-md py-1.5 text-xs font-medium', txType === 'expense' ? 'bg-destructive/20 text-destructive' : 'text-muted-foreground')}>Витрата</button>
                <button type="button" onClick={() => setTxType('income')} className={cn('flex-1 rounded-md py-1.5 text-xs font-medium', txType === 'income' ? 'bg-success/20 text-success' : 'text-muted-foreground')}>Дохід</button>
              </div>
              <div className="flex gap-2">
                <input value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="Сума" type="number" step="0.01" required className="h-8 w-28 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <select value={txCurrency} onChange={(e) => setTxCurrency(e.target.value)} className="h-8 w-16 rounded border border-outline/30 bg-surface-container px-1 text-xs text-foreground"><option value="UAH">₴</option><option value="USD">$</option><option value="EUR">€</option></select>
                <select value={txCategory} onChange={(e) => setTxCategory(e.target.value)} required className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-xs text-foreground"><option value="">Категорія</option>{filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <input value={txDate} onChange={(e) => setTxDate(e.target.value)} type="date" className="h-8 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <input value={txDesc} onChange={(e) => setTxDesc(e.target.value)} placeholder="Опис" className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <button type="submit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-on-primary"><Check className="size-3.5" /></button>
                <button type="button" onClick={() => setShowAddTx(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {groupedTx.map(([date, txs]) => {
              const dayIncome = txs.filter((t) => t.type === 'income' && !t.exchangeId).reduce((s, t) => s + t.amount, 0)
              const dayExpense = txs.filter((t) => t.type === 'expense' && !t.exchangeId).reduce((s, t) => s + t.amount, 0)
              return (
                <div key={date}>
                  <div className="mb-1.5 flex items-center justify-between border-b border-outline-variant/15 pb-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{format(new Date(date), 'd MMMM, EEEE', { locale: uk })}</span>
                    <div className="flex gap-3 text-xs font-medium">
                      {dayIncome > 0 && <span className="text-success">+₴{dayIncome.toLocaleString()}</span>}
                      {dayExpense > 0 && <span className="text-destructive">−₴{dayExpense.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    {txs.map((t) => {
                      const cat = catMap.get(t.category.id)
                      return editTxId === t.id ? (
                        <div key={t.id} className="flex items-center gap-2 rounded-md bg-surface-container/50 px-2 py-1.5">
                          <input value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} type="number" step="0.01" autoFocus className="h-7 w-24 rounded border border-primary bg-surface-container px-2 text-sm focus:outline-none" />
                          <input value={editTxDesc} onChange={(e) => setEditTxDesc(e.target.value)} placeholder="Опис" className="h-7 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditTx(); if (e.key === 'Escape') setEditTxId(null) }} />
                          <button onClick={handleSaveEditTx} className="text-primary"><Check className="size-3.5" /></button>
                          <button onClick={() => setEditTxId(null)} className="text-muted-foreground"><X className="size-3.5" /></button>
                        </div>
                      ) : (
                        <div key={t.id} className={cn('group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-surface-container/50', t.exchangeId && 'bg-violet-500/5')}>
                          {t.exchangeId ? <ArrowLeftRight className="size-3.5 shrink-0 text-violet-400" /> : <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-foreground">{t.description || t.category.name}</div>
                            <div className="text-[10px] text-muted-foreground">{t.exchangeId ? 'Обмін валют' : t.category.name} · {t.user.firstName}</div>
                          </div>
                          <span className={cn('text-sm font-medium', t.exchangeId ? 'text-violet-400' : t.type === 'income' ? 'text-success' : 'text-destructive')}>
                            {t.type === 'income' ? '+' : '−'}{sym(t.currency)}{t.amount.toLocaleString()}
                          </span>
                          <button onClick={() => { setEditTxId(t.id); setEditTxAmount(String(t.amount)); setEditTxDesc(t.description || '') }} className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"><Pencil className="size-3" /></button>
                          <button onClick={() => handleDeleteTx(t.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3" /></button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {filteredTx.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Транзакцій немає</p>}
          </div>
        </div>
      )}

      {/* ── Recurring tab ── */}
      {tab === 'recurring' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Регулярні платежі</h2>
            <button onClick={() => setShowAddRec(!showAddRec)} className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground"><Plus className="size-3.5" /> Платіж</button>
          </div>
          {showAddRec && (
            <form onSubmit={handleAddRec} className="mb-4 space-y-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
              <div className="flex gap-2">
                <input value={recTitle} onChange={(e) => setRecTitle(e.target.value)} placeholder="Назва" required className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                <input value={recAmount} onChange={(e) => setRecAmount(e.target.value)} placeholder="Сума" type="number" step="0.01" required className="h-8 w-24 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
              </div>
              <div className="flex gap-2">
                <select value={recCategory} onChange={(e) => setRecCategory(e.target.value)} required className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-xs text-foreground"><option value="">Категорія</option>{categories.filter((c) => c.type === 'expense').map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <select value={recPeriod} onChange={(e) => setRecPeriod(e.target.value)} className="h-8 w-32 rounded border border-outline/30 bg-surface-container px-2 text-xs text-foreground"><option value="monthly">Щомісяця</option><option value="quarterly">Щокварталу</option><option value="yearly">Щорічно</option></select>
                <input value={recNextDate} onChange={(e) => setRecNextDate(e.target.value)} type="date" required className="h-8 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
                <button type="submit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-on-primary"><Check className="size-3.5" /></button>
                <button type="button" onClick={() => setShowAddRec(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
              </div>
            </form>
          )}
          <div className="space-y-1">
            {recurring.map((r) => {
              const daysUntil = Math.ceil((new Date(r.nextDate).getTime() - Date.now()) / 86400000)
              const isUrgent = daysUntil <= 3 && daysUntil >= 0
              const cat = catMap.get(r.category.id)
              return (
                <div key={r.id} className={cn('group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-container/50', isUrgent && 'border border-warning/30 bg-warning/5')}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
                  <div className="min-w-0 flex-1"><div className="text-sm text-foreground">{r.title}</div><div className="text-[10px] text-muted-foreground">{r.category.name} · {r.period === 'monthly' ? 'щомісяця' : r.period === 'quarterly' ? 'щокварталу' : 'щорічно'}</div></div>
                  <span className="text-xs text-muted-foreground">{format(new Date(r.nextDate), 'd MMM', { locale: uk })}</span>
                  <span className="text-sm font-medium text-destructive">₴{r.amount.toLocaleString()}</span>
                  <button onClick={() => handlePayRec(r.id)} className="flex h-7 items-center gap-1 rounded-md bg-primary/10 px-2 text-xs font-medium text-primary hover:bg-primary/20"><Check className="size-3" /> Сплачено</button>
                  <button onClick={() => handleDeleteRec(r.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
                </div>
              )
            })}
            {recurring.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Регулярних платежів немає</p>}
          </div>
        </div>
      )}

      {/* ── Planned tab ── */}
      {tab === 'planned' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Заплановані витрати</h2>
            <button onClick={() => setShowAddPlan(!showAddPlan)} className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground"><Plus className="size-3.5" /> Витрата</button>
          </div>
          {showAddPlan && (
            <form onSubmit={handleAddPlan} className="mb-4 flex gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
              <input value={planTitle} onChange={(e) => setPlanTitle(e.target.value)} placeholder="Назва" required className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
              <input value={planAmount} onChange={(e) => setPlanAmount(e.target.value)} placeholder="Сума" type="number" step="0.01" required className="h-8 w-24 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
              <input value={planDate} onChange={(e) => setPlanDate(e.target.value)} type="date" className="h-8 rounded border border-outline/30 bg-surface-container px-2 text-xs focus:border-primary focus:outline-none" />
              <button type="submit" className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-on-primary"><Check className="size-3.5" /></button>
              <button type="button" onClick={() => setShowAddPlan(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
            </form>
          )}
          <div className="space-y-1">
            {planned.map((p) => (
              <div key={p.id} className={cn('group flex items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-container/50', p.isCompleted && 'opacity-50')}>
                <div className="min-w-0 flex-1"><div className={cn('text-sm', p.isCompleted ? 'text-muted-foreground line-through' : 'text-foreground')}>{p.title}</div>{p.targetDate && <div className="text-[10px] text-muted-foreground">до {format(new Date(p.targetDate), 'd MMM yyyy', { locale: uk })}</div>}</div>
                <span className="text-sm font-medium text-foreground">₴{p.amount.toLocaleString()}</span>
                {!p.isCompleted && <button onClick={() => handleCompletePlan(p.id)} className="flex h-7 items-center gap-1 rounded-md bg-success/10 px-2 text-xs font-medium text-success hover:bg-success/20"><Check className="size-3" /> Виконано</button>}
                <button onClick={() => handleDeletePlan(p.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
            {planned.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Запланованих витрат немає</p>}
          </div>
        </div>
      )}

      {/* ── Assets tab ── */}
      {tab === 'assets' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Активи</h2>
            <button onClick={() => setShowAddAsset(!showAddAsset)} className="flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground"><Plus className="size-3.5" /> Актив</button>
          </div>
          {showAddAsset && (
            <form onSubmit={handleAddAsset} className="mb-3 flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container/50 p-3">
              <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Назва (Monobank, Готівка)" autoFocus className="h-8 flex-1 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
              <input value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} placeholder="Сума" type="number" step="0.01" className="h-8 w-28 rounded border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
              <select value={assetCurrency} onChange={(e) => setAssetCurrency(e.target.value)} className="h-8 w-16 rounded border border-outline/30 bg-surface-container px-1 text-xs text-foreground"><option value="UAH">₴</option><option value="USD">$</option><option value="EUR">€</option></select>
              <button type="submit" disabled={!assetName.trim() || !assetAmount} className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary text-on-primary disabled:opacity-30"><Check className="size-3.5" /></button>
              <button type="button" onClick={() => setShowAddAsset(false)} className="text-muted-foreground"><X className="size-3.5" /></button>
            </form>
          )}
          <div className="space-y-1">
            {assets.map((a) => editAssetId === a.id ? (
              <div key={a.id} className="flex items-center gap-2 rounded-md bg-surface-container/50 px-3 py-2">
                <span className="flex-1 text-sm text-foreground">{a.name}</span>
                <input value={editAssetAmount} onChange={(e) => setEditAssetAmount(e.target.value)} type="number" step="0.01" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateAssetAmount(); if (e.key === 'Escape') setEditAssetId(null) }} className="h-7 w-28 rounded border border-primary bg-surface-container px-2 text-sm focus:outline-none" />
                <span className="text-xs text-muted-foreground">{a.currency}</span>
                <button onClick={handleUpdateAssetAmount} className="text-primary"><Check className="size-3.5" /></button>
                <button onClick={() => setEditAssetId(null)} className="text-muted-foreground"><X className="size-3.5" /></button>
              </div>
            ) : (
              <div key={a.id} className="group flex items-center gap-3 rounded-md px-3 py-2 hover:bg-surface-container/50">
                <span className="flex-1 text-sm text-foreground">{a.name}</span>
                <span className="text-sm font-semibold text-foreground">{sym(a.currency)}{a.amount.toLocaleString()}</span>
                <button onClick={() => { setEditAssetId(a.id); setEditAssetAmount(String(a.amount)) }} className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"><Pencil className="size-3" /></button>
                <button onClick={() => handleDeleteAsset(a.id)} className="shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"><Trash2 className="size-3" /></button>
              </div>
            ))}
            {/* Budget balance row */}
            {summary && summary.totalByCurrency.map((b) => b.balance !== 0 && (
              <div key={b.currency} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm">
                <span className="flex-1 text-muted-foreground">Баланс бюджету ({b.currency})</span>
                <span className={cn('font-semibold', b.balance >= 0 ? 'text-foreground' : 'text-destructive')}>{sym(b.currency)}{b.balance.toLocaleString()}</span>
              </div>
            ))}
            {assets.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Додайте рахунки, картки, готівку</p>}
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => { setShowAddTx(true); setTab('transactions') }}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
      </button>
    </div>
  )
}
