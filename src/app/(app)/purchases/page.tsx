'use client'

import { useState, useRef } from 'react'
import { ShoppingCart, Plus, Trash2, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { usePurchases } from '@/features/purchases/hooks/use-purchases'
import { purchaseService } from '@/features/purchases/services/purchase-service'

export default function PurchasesPage() {
  const {
    lists, activeList, activeListId, setActiveListId,
    loading, createList, deleteList, addItem, toggleItem, deleteItem, fetchLists,
  } = usePurchases()
  const confirm = useConfirm()

  const [newItemName, setNewItemName] = useState('')
  const [newItemQty, setNewItemQty] = useState('')
  const [showNewList, setShowNewList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editQty, setEditQty] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newItemName.trim()) return
    await addItem(newItemName.trim(), newItemQty.trim() || undefined)
    setNewItemName('')
    setNewItemQty('')
    inputRef.current?.focus()
  }

  function startEdit(itemId: string, name: string, qty: string | null) {
    setEditingItemId(itemId)
    setEditName(name)
    setEditQty(qty || '')
  }

  async function saveEdit() {
    if (!editingItemId || !editName.trim()) return
    await purchaseService.updateItem(editingItemId, { name: editName.trim(), quantity: editQty.trim() || null })
    setEditingItemId(null)
    await fetchLists()
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault()
    if (!newListName.trim()) return
    await createList(newListName.trim())
    setNewListName('')
    setShowNewList(false)
  }

  async function handleDeleteList(id: string) {
    const list = lists.find((l) => l.id === id)
    if (!list) return
    if (!await confirm({ message: `Ви впевнені, що хочете видалити список "${list.name}" та ${list.itemCount} товарів?` })) return
    await deleteList(id)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-surface-container" />
        <div className="h-64 animate-pulse rounded-md bg-surface-container/30" />
      </div>
    )
  }

  // Sort items: active first, bought last
  const sortedItems = activeList
    ? [...activeList.items].sort((a, b) => {
        if (a.isBought !== b.isBought) return a.isBought ? 1 : -1
        return a.sortOrder - b.sortOrder
      })
    : []

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Покупки</h1>

      {/* List tabs */}
      <div className="mb-4 flex items-center gap-1 overflow-x-auto">
        {lists.map((list) => (
          <button
            key={list.id}
            onClick={() => setActiveListId(list.id)}
            className={cn(
              'group flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              activeListId === list.id
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-surface-container'
            )}
          >
            {list.name}
            <span className="text-xs opacity-60">{list.boughtCount}/{list.itemCount}</span>
            {activeListId === list.id && lists.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id) }}
                className="ml-1 opacity-0 group-hover:opacity-100"
              >
                <X className="size-3 text-muted-foreground hover:text-destructive" />
              </button>
            )}
          </button>
        ))}

        {/* New list button */}
        {showNewList ? (
          <form onSubmit={handleCreateList} className="flex items-center gap-1">
            <input
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Назва списку"
              autoFocus
              className="h-8 w-32 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" disabled={!newListName.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary disabled:opacity-30">
              <Check className="size-3.5" />
            </button>
            <button type="button" onClick={() => { setShowNewList(false); setNewListName('') }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container">
              <X className="size-3.5" />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowNewList(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-surface-container"
          >
            <Plus className="size-4" />
            Список
          </button>
        )}
      </div>

      {/* Empty — no lists */}
      {lists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Списків поки немає</h2>
          <p className="mt-1 text-sm text-muted-foreground">Створіть перший список покупок</p>
          <button
            onClick={() => setShowNewList(true)}
            className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90"
          >
            Створити список
          </button>
        </div>
      )}

      {/* Active list content */}
      {activeList && (
        <div>
          {/* Quick add */}
          <form onSubmit={handleAddItem} className="mb-4 flex gap-2">
            <input
              ref={inputRef}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Додати товар..."
              className="h-11 flex-1 rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
            <input
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              placeholder="К-сть (2 шт, 1 кг)"
              className="h-11 w-36 rounded-md border border-outline/30 bg-surface-container px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newItemName.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary disabled:opacity-30"
            >
              <Plus className="size-5" />
            </button>
          </form>

          {/* Items */}
          <div className="space-y-1">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-surface-container/50',
                  item.isBought && 'opacity-50'
                )}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleItem(item.id)}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-[3px] border-2 transition-colors',
                    item.isBought ? 'border-success bg-success text-white' : 'border-outline hover:border-primary'
                  )}
                >
                  {item.isBought && (
                    <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Name + quantity — editable on double click */}
                {editingItemId === item.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); saveEdit() }} className="flex flex-1 items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="h-8 flex-1 rounded-md border border-primary bg-surface-container px-2 text-sm focus:outline-none"
                    />
                    <input
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      placeholder="К-сть"
                      className="h-8 w-24 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Check className="size-3.5" />
                    </button>
                    <button type="button" onClick={() => setEditingItemId(null)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container">
                      <X className="size-3.5" />
                    </button>
                  </form>
                ) : (
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onDoubleClick={() => startEdit(item.id, item.name, item.quantity)}
                  >
                    <span className={cn('text-sm', item.isBought && 'line-through text-muted-foreground')}>
                      {item.name}
                    </span>
                    {item.quantity && (
                      <span className="ml-2 text-xs text-muted-foreground">{item.quantity}</span>
                    )}
                  </div>
                )}

                {/* Delete */}
                {editingItemId !== item.id && (
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Empty list */}
          {activeList.items.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Список порожній. Додайте перший товар.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
