'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2, ShoppingCart, AlertCircle, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Purchase } from '@/lib/types'

// ─── Сортировка: активные → купленные ─────────────────────────────────────────
function sortPurchases(items: Purchase[]): Purchase[] {
  const active = items.filter(i => !i.is_bought).sort((a, b) => a.sort_order - b.sort_order)
  const bought = items.filter(i => i.is_bought).sort((a, b) =>
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  return [...active, ...bought]
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────
function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    />
  )
}

// ─── Sheet (общий контейнер для диалогов снизу) ───────────────────────────────
function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <AnimatePresence>
      <Backdrop onClose={onClose} />
      <motion.div
        className="fixed inset-x-4 bottom-6 z-50 rounded-3xl bg-[#2c2c2e] p-6 shadow-2xl
                   sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Диалог редактирования ────────────────────────────────────────────────────
function EditDialog({ item, onSave, onClose }: {
  item: Purchase
  onSave: (name: string, qty: string) => void
  onClose: () => void
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
    <Sheet onClose={onClose}>
      <h2 className="mb-5 text-lg font-bold">Редактировать товар</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Название
          </span>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Количество
          </span>
          <input
            value={qty} onChange={e => setQty(e.target.value)} placeholder="напр. 2 шт, 500 г"
            className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base
                       outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
          />
        </label>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-white/10 text-sm font-medium
                       text-muted-foreground hover:bg-white/8 active:scale-95 transition">
            Отмена
          </button>
          <button type="submit" disabled={!name.trim()}
            className="h-12 flex-1 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold
                       hover:opacity-85 active:scale-95 disabled:opacity-30 transition">
            Сохранить
          </button>
        </div>
      </form>
    </Sheet>
  )
}

// ─── Диалог удаления списка ───────────────────────────────────────────────────
function DeleteListDialog({ listName, count, onConfirm, onClose }: {
  listName: string; count: number; onConfirm: () => void; onClose: () => void
}) {
  return (
    <Sheet onClose={onClose}>
      <h2 className="mb-2 text-lg font-bold">Удалить список?</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Список <span className="font-semibold text-foreground">«{listName}»</span>{' '}
        и{' '}
        {count > 0
          ? <span className="font-semibold text-destructive">{count} товар(а/ов)</span>
          : 'все товары'
        }{' '}
        будут удалены навсегда.
      </p>
      <div className="flex gap-2">
        <button onClick={onClose}
          className="h-12 flex-1 rounded-2xl border border-white/10 text-sm font-medium
                     text-muted-foreground hover:bg-white/8 active:scale-95 transition">
          Отмена
        </button>
        <button onClick={() => { onConfirm(); onClose() }}
          className="h-12 flex-1 rounded-2xl bg-destructive/15 text-destructive text-sm font-semibold
                     hover:bg-destructive/25 active:scale-95 transition">
          Удалить
        </button>
      </div>
    </Sheet>
  )
}

// ─── Пустой экран (нет ни одного списка) ─────────────────────────────────────
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-5 px-8 pt-24 text-center"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-3xl bg-white/4 p-6">
        <ShoppingCart className="size-12 text-muted-foreground/20" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-foreground">Списков пока нет</p>
        <p className="text-sm text-muted-foreground/60">Создайте первый список покупок</p>
      </div>
      <button
        onClick={onCreate}
        className="flex h-12 items-center gap-2 rounded-2xl bg-primary px-6
                   text-sm font-semibold text-primary-foreground
                   hover:opacity-85 active:scale-95 transition"
      >
        <Plus className="size-4" /> Создать список
      </button>
    </motion.div>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────
export default function PurchasesPage() {
  const [familyId, setFamilyId]             = useState<string | null>(null)
  const [purchases, setPurchases]           = useState<Purchase[]>([])
  const [lists, setLists]                   = useState<string[]>([])
  const [activeList, setActiveList]         = useState<string | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [inputName, setInputName]           = useState('')
  const [inputQty, setInputQty]             = useState('')
  const [newListName, setNewListName]       = useState('')
  const [showNewList, setShowNewList]       = useState(false)
  const [editingItem, setEditingItem]       = useState<Purchase | null>(null)
  const [showDeleteList, setShowDeleteList] = useState(false)

  const inputRef   = useRef<HTMLInputElement>(null)
  const newListRef = useRef<HTMLInputElement>(null)

  // ── Загрузка ─────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile, error: profileErr } = await supabase
        .from('profiles').select('family_id').eq('id', user.id).single()

      if (profileErr || !profile) {
        setError('Профиль не найден. Запустите SQL-скрипт для создания профилей.')
        setLoading(false)
        return
      }

      const fid: string = profile.family_id
      setFamilyId(fid)

      const { data, error: fetchErr } = await supabase
        .from('purchases').select('*').eq('family_id', fid).order('sort_order', { ascending: true })

      if (fetchErr) {
        setError(`Ошибка загрузки: ${fetchErr.message}`)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const rows = data as Purchase[]
        setPurchases(rows)
        const unique = [...new Set(rows.map(p => p.list_name))]
        setLists(unique)
        setActiveList(unique[0])
      }
      setLoading(false)
    }
    init()
  }, [])

  // ── Realtime ─────────────────────────────────────────────────────────────
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
            setLists(prev => {
              if (prev.includes(item.list_name)) return prev
              const next = [...prev, item.list_name]
              setActiveList(al => al ?? item.list_name)
              return next
            })
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

  const visibleItems = activeList ? sortPurchases(purchases.filter(p => p.list_name === activeList)) : []
  const boughtCount  = visibleItems.filter(i => i.is_bought).length

  // ── Обработчики ──────────────────────────────────────────────────────────

  function openNewList() {
    setShowNewList(true)
    setTimeout(() => newListRef.current?.focus(), 50)
  }

  function handleAddList(e: React.FormEvent) {
    e.preventDefault()
    const raw  = newListName.trim()
    if (!raw) return
    const name = lists.includes(raw) ? `${raw} 2` : raw
    setLists(prev => [...prev, name])
    setActiveList(name)
    setNewListName('')
    setShowNewList(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = inputName.trim()
    if (!name || !familyId || !activeList) return

    const tempId    = crypto.randomUUID()
    const sortOrder = Math.floor(Date.now() / 1000)
    const temp: Purchase = {
      id: tempId, family_id: familyId, list_name: activeList,
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
      .insert({ family_id: familyId, list_name: activeList, name, quantity: temp.quantity, sort_order: sortOrder })
      .select().single()

    if (error) {
      console.error('Insert error:', error)
      setPurchases(prev => prev.filter(p => p.id !== tempId))
    } else {
      setPurchases(prev => prev.map(p => p.id === tempId ? (data as Purchase) : p))
    }
  }

  async function handleToggle(item: Purchase) {
    const next = !item.is_bought
    setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, is_bought: next } : p))
    const { error } = await supabase.from('purchases').update({ is_bought: next }).eq('id', item.id)
    if (error) {
      console.error('Toggle error:', error)
      setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, is_bought: item.is_bought } : p))
    }
  }

  async function handleDelete(id: string) {
    setPurchases(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (error) console.error('Delete error:', error)
  }

  async function handleSaveEdit(id: string, name: string, qty: string) {
    const quantity = qty || null
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, name, quantity } : p))
    await supabase.from('purchases').update({ name, quantity }).eq('id', id)
  }

  async function handleDeleteList() {
    if (!activeList || !familyId) return
    const target    = activeList
    const remaining = lists.filter(l => l !== target)

    setPurchases(prev => prev.filter(p => p.list_name !== target))
    setLists(remaining)
    setActiveList(remaining[0] ?? null)

    const { error } = await supabase
      .from('purchases').delete().eq('family_id', familyId).eq('list_name', target)
    if (error) console.error('Delete list error:', error)
  }

  // ── Рендер ───────────────────────────────────────────────────────────────

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

  // Нет ни одного списка
  if (lists.length === 0) return (
    <>
      <EmptyState onCreate={openNewList} />
      <AnimatePresence>
        {showNewList && (
          <Sheet onClose={() => { setShowNewList(false); setNewListName('') }}>
            <h2 className="mb-5 text-lg font-bold">Новый список</h2>
            <form onSubmit={handleAddList} className="flex flex-col gap-3">
              <input
                ref={newListRef}
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                placeholder="Например: Сильпо, Аптека..."
                className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-base
                           outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition"
              />
              <button
                type="submit" disabled={!newListName.trim()}
                className="h-12 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold
                           hover:opacity-85 active:scale-95 disabled:opacity-30 transition">
                Создать
              </button>
            </form>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  )

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pt-5 pb-8 sm:px-6">

        {/* ── 1. Категории (табы) + кнопка «+» в одну строку ──────────── */}
        <div className="mb-5 flex items-center gap-2">
          {/* Кнопка добавления нового списка */}
          <AnimatePresence mode="wait">
            {showNewList ? (
              <motion.form
                key="new-list-form"
                onSubmit={handleAddList}
                className="flex items-center gap-2"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
              >
                <input
                  ref={newListRef}
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Название..."
                  onKeyDown={e => e.key === 'Escape' && (setShowNewList(false), setNewListName(''))}
                  className="h-9 w-32 rounded-2xl border border-primary/50 bg-white/5 px-3 text-sm
                             outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="submit" disabled={!newListName.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary
                             text-primary-foreground active:scale-90 disabled:opacity-30 transition">
                  <Plus className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewList(false); setNewListName('') }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                             border border-white/10 text-muted-foreground hover:bg-white/8 active:scale-90 transition">
                  ✕
                </button>
              </motion.form>
            ) : (
              <motion.button
                key="add-btn"
                onClick={openNewList}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                           border border-dashed border-white/20 text-muted-foreground
                           hover:border-white/40 hover:text-foreground active:scale-90 transition"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                title="Новый список"
              >
                <Plus className="size-4" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Горизонтальный скролл табов */}
          <div className="flex flex-1 items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {lists.map(list => (
              <div key={list} className="flex shrink-0 items-center gap-0.5">
                <button
                  onClick={() => setActiveList(list)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
                    activeList === list
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/7 text-muted-foreground hover:bg-white/12 hover:text-foreground'
                  }`}
                >
                  {list}
                </button>

                {activeList === list && (
                  <button
                    onClick={() => setShowDeleteList(true)}
                    title={`Удалить список «${list}»`}
                    className="flex h-7 w-7 items-center justify-center rounded-full
                               text-muted-foreground/40 hover:bg-destructive/15 hover:text-destructive
                               active:scale-90 transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}

            {boughtCount > 0 && (
              <span className="ml-auto shrink-0 text-xs text-muted-foreground/50">
                {boughtCount}/{visibleItems.length}
              </span>
            )}
          </div>
        </div>

        {/* ── 2. Заголовок активного списка + inline-добавление ─────── */}
        {activeList && (
          <div className="mb-4">
            <h2 className="mb-2 text-lg font-bold">{activeList}</h2>
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-[#2c2c2e] px-4
                              focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
                <input
                  ref={inputRef}
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="Добавить товар..."
                  className="h-11 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/40"
                />
                {inputName && (
                  <input
                    value={inputQty}
                    onChange={e => setInputQty(e.target.value)}
                    placeholder="кол-во"
                    className="w-16 bg-transparent text-right text-sm outline-none placeholder:text-muted-foreground/35"
                  />
                )}
              </div>
              <button
                type="submit" disabled={!inputName.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary
                           text-primary-foreground hover:opacity-85 active:scale-90 disabled:opacity-30 transition">
                <Plus className="size-5" />
              </button>
            </form>
          </div>
        )}

        {/* ── 3. Список товаров ────────────────────────────────────────── */}
        {visibleItems.length === 0 ? (
          <motion.div
            className="flex flex-col items-center gap-3 pt-14 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
          >
            <div className="rounded-3xl bg-white/4 p-5">
              <ShoppingCart className="size-10 text-muted-foreground/20" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground/60">
              Список пустой.<br />Добавьте первый товар!
            </p>
          </motion.div>
        ) : (
          <motion.ul layout className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {visibleItems.map(item => (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 350 }}
                  className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                    item.is_bought ? 'bg-white/3' : 'bg-[#2c2c2e] shadow-sm shadow-black/20 hover:bg-white/8'
                  }`}
                >
                  {/* Квадратный чекбокс Apple Green */}
                  <button
                    onClick={() => handleToggle(item)}
                    className="shrink-0 flex h-[22px] w-[22px] items-center justify-center
                               rounded-md border-2 transition-all duration-200 active:scale-85"
                    style={item.is_bought
                      ? { backgroundColor: '#34C759', borderColor: '#34C759' }
                      : { borderColor: 'rgba(255,255,255,0.2)' }
                    }
                  >
                    {item.is_bought && (
                      <svg className="size-3 text-white" viewBox="0 0 24 24" fill="none"
                           stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  {/* Название */}
                  <span className={`flex-1 min-w-0 select-none text-[15px] leading-snug transition-all duration-200 ${
                    item.is_bought
                      ? 'text-foreground/40 line-through decoration-foreground/20'
                      : 'text-foreground'
                  }`}>
                    {item.name}
                  </span>

                  {/* Правая панель: badge + кнопки */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {item.quantity && (
                      <span className={`rounded-full px-2.5 py-[3px] text-xs font-medium transition-colors ${
                        item.is_bought
                          ? 'bg-white/5 text-foreground/25'
                          : 'bg-white/10 text-muted-foreground'
                      }`}>
                        {item.quantity}
                      </span>
                    )}

                    <button
                      onClick={() => setEditingItem(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl
                                 text-muted-foreground/30 hover:bg-white/8 hover:text-muted-foreground
                                 active:scale-90 transition opacity-0 group-hover:opacity-100"
                    >
                      <Pencil className="size-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-xl
                                 text-muted-foreground/30 hover:bg-destructive/15 hover:text-destructive
                                 active:scale-90 transition"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>

      {/* ── Диалоги ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingItem && (
          <EditDialog
            key="edit"
            item={editingItem}
            onSave={(name, qty) => handleSaveEdit(editingItem.id, name, qty)}
            onClose={() => setEditingItem(null)}
          />
        )}
        {showDeleteList && activeList && (
          <DeleteListDialog
            key="del-list"
            listName={activeList}
            count={visibleItems.length}
            onConfirm={handleDeleteList}
            onClose={() => setShowDeleteList(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
