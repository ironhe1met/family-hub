'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, ShoppingCart, AlertCircle, Pencil, X, Check, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { strings } from '@/lib/i18n'
import type { Purchase, PurchaseList } from '@/lib/types'

// ─── Sorting ──────────────────────────────────────────────────────────────────
function sortPurchases(items: Purchase[]): Purchase[] {
  const active = items.filter(i => !i.is_bought).sort((a, b) => a.sort_order - b.sort_order)
  const bought = items.filter(i => i.is_bought).sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  return [...active, ...bought]
}

// ─── Backdrop & Dialog ────────────────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/50"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    />
  )
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div
          className="w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-lg bg-surface-container-high p-6 shadow-2xl"
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={e => e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>
    </>
  )
}

// ─── Edit Item Dialog (Google style) ──────────────────────────────────────────
function EditDialog({ item, onSave, onClose }: {
  item: Purchase; onSave: (name: string, qty: string) => void; onClose: () => void
}) {
  const [name, setName] = useState(item.name)
  const [qty, setQty]   = useState(item.quantity ?? '')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(name.trim(), qty.trim())
    onClose()
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {/* Name — underline header */}
        <input autoFocus value={name} onChange={e => setName(e.target.value)}
          className="h-12 border-b-2 border-outline-variant/30 bg-transparent px-0 text-xl font-medium
                     outline-none placeholder:text-muted-foreground/25
                     focus:border-primary transition-colors" />

        {/* Quantity — icon row */}
        <div className="flex items-center gap-3">
          <Package className="size-4 shrink-0 text-muted-foreground/50" />
          <input value={qty} onChange={e => setQty(e.target.value)} placeholder={strings.purchasesQtyPlaceholder}
            className="h-11 flex-1 rounded-md bg-surface-container-high px-3 text-sm
                       outline-none focus:ring-1 focus:ring-primary/30 transition" />
        </div>

        {/* Actions */}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:bg-primary/8 active:scale-[0.98] transition">
            {strings.cancel}
          </button>
          <button type="submit" disabled={!name.trim()}
            className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground
                       hover:opacity-90 active:scale-[0.98] disabled:opacity-30 transition">
            {strings.save}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

// ─── Delete List Dialog ───────────────────────────────────────────────────────
function DeleteListDialog({ listName, count, onConfirm, onClose }: {
  listName: string; count: number; onConfirm: () => void; onClose: () => void
}) {
  return (
    <Dialog onClose={onClose}>
      <h2 className="mb-2 text-lg font-medium">{strings.purchasesDeleteList}</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        {strings.purchasesDeleteListMsg(listName, count)}
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose}
          className="h-10 rounded-lg px-5 text-sm font-medium text-muted-foreground hover:bg-primary/8 active:scale-[0.98] transition">
          {strings.cancel}
        </button>
        <button onClick={() => { onConfirm(); onClose() }}
          className="h-10 rounded-full bg-destructive/12 px-6 text-destructive text-sm font-medium
                     hover:bg-destructive/20 active:scale-[0.98] transition">
          {strings.delete}
        </button>
      </div>
    </Dialog>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-8 pt-24 text-center">
      <div className="rounded-md bg-primary/8 p-6">
        <ShoppingCart className="size-12 text-primary/40" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium text-foreground">{strings.purchasesEmpty}</p>
        <p className="text-sm text-muted-foreground">{strings.purchasesEmptySub}</p>
      </div>
      <button onClick={onCreate}
        className="flex h-12 items-center gap-2 rounded-full bg-primary px-6
                   text-sm font-medium text-primary-foreground
                   hover:opacity-90 active:scale-[0.98] transition">
        <Plus className="size-4" /> {strings.purchasesCreateList}
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const [familyId, setFamilyId]             = useState<string | null>(null)
  const [purchases, setPurchases]           = useState<Purchase[]>([])
  const [lists, setLists]                   = useState<PurchaseList[]>([])
  const [activeListName, setActiveListName] = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [inputName, setInputName]           = useState('')
  const [inputQty, setInputQty]             = useState('')
  const [newListName, setNewListName]       = useState('')
  const [showNewList, setShowNewList]       = useState(false)
  const [editingItem, setEditingItem]       = useState<Purchase | null>(null)
  const [showDeleteList, setShowDeleteList] = useState(false)
  const [renamingList, setRenamingList]     = useState<string | null>(null)
  const [renameValue, setRenameValue]       = useState('')

  const inputRef   = useRef<HTMLInputElement>(null)
  const newListRef = useRef<HTMLInputElement>(null)
  const renameRef  = useRef<HTMLInputElement>(null)

  // ── Init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileErr } = await supabase
        .from('profiles').select('family_id').eq('id', user.id).single()

      if (profileErr || !profile) {
        setError(strings.profileNotFound)
        setLoading(false)
        return
      }

      const fid: string = profile.family_id
      setFamilyId(fid)

      // Fetch lists from purchase_lists table (persists empty lists)
      const { data: listData } = await supabase
        .from('purchase_lists').select('*').eq('family_id', fid).order('sort_order')

      const fetchedLists: PurchaseList[] = (listData as PurchaseList[]) ?? []
      setLists(fetchedLists)
      if (fetchedLists.length > 0) setActiveListName(fetchedLists[0].name)

      // Fetch items
      const { data, error: fetchErr } = await supabase
        .from('purchases').select('*').eq('family_id', fid).order('sort_order', { ascending: true })

      if (fetchErr) {
        setError(strings.loadError(fetchErr.message))
        setLoading(false)
        return
      }

      if (data) setPurchases(data as Purchase[])

      // If no purchase_lists table yet, fall back to deriving from purchases
      if (fetchedLists.length === 0 && data && data.length > 0) {
        const unique = [...new Set((data as Purchase[]).map(p => p.list_name))]
        const fallback: PurchaseList[] = unique.map((name, i) => ({
          id: crypto.randomUUID(), family_id: fid, name, sort_order: i, created_at: new Date().toISOString(),
        }))
        setLists(fallback)
        setActiveListName(unique[0])
      }

      setLoading(false)
    }
    init()
  }, [])

  // ── Realtime ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!familyId) return
    const ch = supabase
      .channel('purchases-rt')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'purchases', filter: `family_id=eq.${familyId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const item = payload.new as Purchase
            setPurchases(prev => prev.some(p => p.id === item.id) ? prev : [...prev, item])
          }
          if (payload.eventType === 'UPDATE') {
            const item = payload.new as Purchase
            setPurchases(prev => prev.map(p => p.id === item.id ? item : p))
          }
          if (payload.eventType === 'DELETE') {
            setPurchases(prev => prev.filter(p => p.id !== payload.old.id))
          }
        }
      ).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [familyId])

  const listNames = lists.map(l => l.name)
  const visibleItems = activeListName ? sortPurchases(purchases.filter(p => p.list_name === activeListName)) : []
  const boughtCount  = visibleItems.filter(i => i.is_bought).length

  // ── Handlers ───────────────────────────────────────────────────────────

  function openNewList() {
    setShowNewList(true)
    setTimeout(() => newListRef.current?.focus(), 50)
  }

  async function handleAddList(e: React.FormEvent) {
    e.preventDefault()
    const raw = newListName.trim()
    if (!raw || !familyId) return
    const name = listNames.includes(raw) ? `${raw} 2` : raw

    const tempList: PurchaseList = {
      id: crypto.randomUUID(), family_id: familyId, name, sort_order: lists.length, created_at: new Date().toISOString(),
    }
    setLists(prev => [...prev, tempList])
    setActiveListName(name)
    setNewListName('')
    setShowNewList(false)

    const { data, error } = await supabase
      .from('purchase_lists').insert({ family_id: familyId, name, sort_order: lists.length }).select().single()
    if (error) {
      console.error('Add list error:', error)
      // If table doesn't exist yet, keep local state
    } else if (data) {
      setLists(prev => prev.map(l => l.id === tempList.id ? (data as PurchaseList) : l))
    }
  }

  async function handleRenameList() {
    if (!renamingList || !renameValue.trim() || !familyId) return
    const oldName = renamingList
    const newName = renameValue.trim()
    if (oldName === newName) { setRenamingList(null); return }

    setLists(prev => prev.map(l => l.name === oldName ? { ...l, name: newName } : l))
    setPurchases(prev => prev.map(p => p.list_name === oldName ? { ...p, list_name: newName } : p))
    if (activeListName === oldName) setActiveListName(newName)
    setRenamingList(null)

    await supabase.from('purchase_lists').update({ name: newName }).eq('family_id', familyId).eq('name', oldName)
    await supabase.from('purchases').update({ list_name: newName }).eq('family_id', familyId).eq('list_name', oldName)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = inputName.trim()
    if (!name || !familyId || !activeListName) return

    const tempId = crypto.randomUUID()
    const sortOrder = Math.floor(Date.now() / 1000)
    const temp: Purchase = {
      id: tempId, family_id: familyId, list_name: activeListName,
      name, quantity: inputQty.trim() || null,
      is_bought: false, sort_order: sortOrder,
      created_at: new Date().toISOString(),
    }

    setPurchases(prev => [...prev, temp])
    setInputName('')
    setInputQty('')
    inputRef.current?.focus()

    const { data, error } = await supabase
      .from('purchases')
      .insert({ family_id: familyId, list_name: activeListName, name, quantity: temp.quantity, sort_order: sortOrder })
      .select().single()

    if (error) {
      setPurchases(prev => prev.filter(p => p.id !== tempId))
    } else {
      setPurchases(prev => prev.map(p => p.id === tempId ? (data as Purchase) : p))
    }
  }

  async function handleToggle(item: Purchase) {
    const next = !item.is_bought
    setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, is_bought: next } : p))
    const { error } = await supabase.from('purchases').update({ is_bought: next }).eq('id', item.id)
    if (error) setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, is_bought: item.is_bought } : p))
  }

  async function handleDelete(id: string) {
    setPurchases(prev => prev.filter(p => p.id !== id))
    await supabase.from('purchases').delete().eq('id', id)
  }

  async function handleSaveEdit(id: string, name: string, qty: string) {
    const quantity = qty || null
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, name, quantity } : p))
    await supabase.from('purchases').update({ name, quantity }).eq('id', id)
  }

  async function handleDeleteList() {
    if (!activeListName || !familyId) return
    const target = activeListName
    const remaining = lists.filter(l => l.name !== target)

    setPurchases(prev => prev.filter(p => p.list_name !== target))
    setLists(remaining)
    setActiveListName(remaining[0]?.name ?? null)

    await supabase.from('purchases').delete().eq('family_id', familyId).eq('list_name', target)
    await supabase.from('purchase_lists').delete().eq('family_id', familyId).eq('name', target)
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="size-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center gap-3 p-8 pt-16 text-center">
      <AlertCircle className="size-10 text-destructive" />
      <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
    </div>
  )

  if (lists.length === 0) return (
    <>
      <EmptyState onCreate={openNewList} />
      <AnimatePresence>
        {showNewList && (
          <Dialog onClose={() => { setShowNewList(false); setNewListName('') }}>
            <form onSubmit={handleAddList} className="flex flex-col gap-3">
              <input ref={newListRef} value={newListName} onChange={e => setNewListName(e.target.value)}
                placeholder={strings.purchasesListExample}
                className="h-12 border-b-2 border-outline-variant/30 bg-transparent px-0 text-xl font-medium
                           outline-none placeholder:text-muted-foreground/25
                           focus:border-primary transition-colors" />
              <div className="mt-2 flex justify-end">
                <button type="submit" disabled={!newListName.trim()}
                  className="h-10 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground
                             hover:opacity-90 active:scale-[0.98] disabled:opacity-30 transition">
                  {strings.create}
                </button>
              </div>
            </form>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  )

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-24 sm:px-6">

        {/* ── Tabs row ─────────────────────────────────────────── */}
        <div className="mb-4 flex items-center gap-2">
          {/* Add list button */}
          {showNewList ? (
            <form onSubmit={handleAddList} className="flex items-center gap-1.5">
              <input ref={newListRef} value={newListName} onChange={e => setNewListName(e.target.value)}
                placeholder={strings.listNamePlaceholder}
                onKeyDown={e => e.key === 'Escape' && (setShowNewList(false), setNewListName(''))}
                className="h-8 w-28 rounded-md border border-primary/50 bg-surface-container-high px-3 text-xs
                           outline-none focus:border-primary focus:ring-1 focus:ring-primary/20" />
              <button type="submit" disabled={!newListName.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary
                           text-primary-foreground active:scale-90 disabled:opacity-30 transition">
                <Plus className="size-3.5" />
              </button>
              <button type="button" onClick={() => { setShowNewList(false); setNewListName('') }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                           text-muted-foreground hover:bg-surface-container-high active:scale-90 transition">
                <X className="size-3.5" />
              </button>
            </form>
          ) : (
            <button onClick={openNewList}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                         border border-dashed border-outline-variant text-muted-foreground
                         hover:border-primary hover:text-primary active:scale-90 transition"
              title={strings.purchasesNewList}>
              <Plus className="size-3.5" />
            </button>
          )}

          {/* List tabs */}
          <div className="flex flex-1 items-center gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {lists.map(list => (
              <div key={list.id} className="flex shrink-0 items-center">
                <button onClick={() => setActiveListName(list.name)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors active:scale-[0.97] ${
                    activeListName === list.name
                      ? 'bg-primary/15 text-primary glow-primary-sm'
                      : 'text-muted-foreground hover:bg-primary/8 hover:text-primary'
                  }`}>
                  {list.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Active list tile ─────────────────────────────────── */}
        {activeListName && (
          <div className="rounded-md bg-surface-container p-4">
            {/* Header with rename */}
            <div className="mb-3 flex items-center gap-2">
              {renamingList === activeListName ? (
                <form onSubmit={e => { e.preventDefault(); handleRenameList() }} className="flex flex-1 items-center gap-1.5">
                  <input ref={renameRef} value={renameValue} onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Escape' && setRenamingList(null)}
                    autoFocus
                    className="h-8 flex-1 rounded-lg border border-primary/50 bg-surface-container-high px-2.5 text-sm font-medium
                               outline-none focus:border-primary" />
                  <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-md text-primary hover:bg-primary/10 transition">
                    <Check className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => setRenamingList(null)}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container-highest transition">
                    <X className="size-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <h2 className="text-base font-medium">{activeListName}</h2>
                  <button onClick={() => { setRenamingList(activeListName); setRenameValue(activeListName); setTimeout(() => renameRef.current?.focus(), 50) }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 hover:text-primary hover:bg-primary/10 transition">
                    <Pencil className="size-3" />
                  </button>
                  <button onClick={() => setShowDeleteList(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition">
                    <Trash2 className="size-3" />
                  </button>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {boughtCount > 0 && `${boughtCount}/${visibleItems.length}`}
                  </span>
                </>
              )}
            </div>

            {/* Add item */}
            <form onSubmit={handleAdd} className="mb-2 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-outline-variant/40 bg-surface-container-high px-3
                              focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                <input ref={inputRef} value={inputName} onChange={e => setInputName(e.target.value)}
                  placeholder={strings.purchasesAddItem}
                  className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50" />
                {inputName && (
                  <input value={inputQty} onChange={e => setInputQty(e.target.value)}
                    placeholder={strings.purchasesQty}
                    className="w-14 bg-transparent text-right text-xs outline-none placeholder:text-muted-foreground/40" />
                )}
              </div>
              <button type="submit" disabled={!inputName.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary
                           text-primary-foreground hover:opacity-90 active:scale-90 disabled:opacity-30 transition">
                <Plus className="size-4" />
              </button>
            </form>

            {/* Items */}
            {visibleItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ShoppingCart className="size-7 text-muted-foreground/15" />
                <p className="text-xs text-muted-foreground">{strings.purchasesEmptyList}</p>
              </div>
            ) : (
              <ul className="flex flex-col">
                {visibleItems.map((item, idx) => (
                  <li key={item.id}
                    className={`group flex items-center gap-3 px-2 py-2 rounded-lg transition-colors
                      ${idx < visibleItems.length - 1 ? 'border-b border-outline-variant/15' : ''}
                      ${item.is_bought ? 'opacity-50' : 'hover:bg-surface-container-high'}`}
                  >
                    <button onClick={() => handleToggle(item)}
                      className="shrink-0 flex h-[20px] w-[20px] items-center justify-center
                                 rounded-[3px] border-2 transition-all duration-200 active:scale-85"
                      style={item.is_bought
                        ? { backgroundColor: 'var(--success)', borderColor: 'var(--success)' }
                        : { borderColor: 'var(--md-outline-variant)' }
                      }>
                      {item.is_bought && (
                        <svg className="size-2.5 text-white" viewBox="0 0 24 24" fill="none"
                             stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <span className={`flex-1 min-w-0 select-none text-sm leading-snug ${
                      item.is_bought ? 'text-foreground/40 line-through decoration-foreground/15' : 'text-foreground'
                    }`}>{item.name}</span>

                    <div className="flex shrink-0 items-center gap-1">
                      {item.quantity && (
                        <span className={`rounded-sm px-2 py-[2px] text-[11px] font-medium ${
                          item.is_bought ? 'text-foreground/20' : 'bg-success/10 text-success'
                        }`}>{item.quantity}</span>
                      )}
                      <button onClick={() => setEditingItem(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg
                                   text-muted-foreground/20 hover:bg-primary/10 hover:text-primary
                                   active:scale-90 transition opacity-0 group-hover:opacity-100">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => handleDelete(item.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg
                                   text-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive
                                   active:scale-90 transition opacity-0 group-hover:opacity-100">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {editingItem && (
          <EditDialog key="edit" item={editingItem}
            onSave={(name, qty) => handleSaveEdit(editingItem.id, name, qty)}
            onClose={() => setEditingItem(null)} />
        )}
        {showDeleteList && activeListName && (
          <DeleteListDialog key="del-list" listName={activeListName} count={visibleItems.length}
            onConfirm={handleDeleteList} onClose={() => setShowDeleteList(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
