'use client'

import { useState, useEffect, useCallback } from 'react'
import { purchaseService, type PurchaseList } from '../services/purchase-service'

export function usePurchases() {
  const [lists, setLists] = useState<PurchaseList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchLists = useCallback(async () => {
    try {
      const data = await purchaseService.getLists()
      setLists(data.lists)
      if (!activeListId && data.lists.length > 0) {
        setActiveListId(data.lists[0].id)
      }
    } catch (err) {
      console.error('Fetch purchases error:', err)
    } finally {
      setLoading(false)
    }
  }, [activeListId])

  useEffect(() => { fetchLists() }, [fetchLists])

  const activeList = lists.find((l) => l.id === activeListId) || null

  const createList = useCallback(async (name: string) => {
    const list = await purchaseService.createList(name)
    const newList = { ...list, items: [], itemCount: 0, boughtCount: 0 }
    setLists((prev) => [...prev, newList])
    setActiveListId(list.id)
    return list
  }, [])

  const deleteList = useCallback(async (id: string) => {
    await purchaseService.deleteList(id)
    setLists((prev) => {
      const filtered = prev.filter((l) => l.id !== id)
      if (activeListId === id && filtered.length > 0) {
        setActiveListId(filtered[0].id)
      } else if (filtered.length === 0) {
        setActiveListId(null)
      }
      return filtered
    })
  }, [activeListId])

  const addItem = useCallback(async (name: string, quantity?: string) => {
    if (!activeListId) return
    const item = await purchaseService.addItem(activeListId, name, quantity)
    setLists((prev) => prev.map((l) =>
      l.id === activeListId
        ? { ...l, items: [...l.items, item], itemCount: l.itemCount + 1 }
        : l
    ))
  }, [activeListId])

  const toggleItem = useCallback(async (itemId: string) => {
    const list = lists.find((l) => l.items.some((i) => i.id === itemId))
    if (!list) return
    const item = list.items.find((i) => i.id === itemId)!
    const newBought = !item.isBought

    // Optimistic
    setLists((prev) => prev.map((l) => ({
      ...l,
      items: l.items.map((i) => i.id === itemId ? { ...i, isBought: newBought } : i),
      boughtCount: l.id === list.id ? l.boughtCount + (newBought ? 1 : -1) : l.boughtCount,
    })))

    try {
      await purchaseService.toggleItem(itemId, newBought)
    } catch {
      // Rollback
      setLists((prev) => prev.map((l) => ({
        ...l,
        items: l.items.map((i) => i.id === itemId ? { ...i, isBought: !newBought } : i),
        boughtCount: l.id === list.id ? l.boughtCount + (newBought ? -1 : 1) : l.boughtCount,
      })))
    }
  }, [lists])

  const deleteItem = useCallback(async (itemId: string) => {
    setLists((prev) => prev.map((l) => ({
      ...l,
      items: l.items.filter((i) => i.id !== itemId),
      itemCount: l.items.some((i) => i.id === itemId) ? l.itemCount - 1 : l.itemCount,
    })))
    await purchaseService.deleteItem(itemId)
  }, [])

  return {
    lists,
    activeList,
    activeListId,
    setActiveListId,
    loading,
    createList,
    deleteList,
    addItem,
    toggleItem,
    deleteItem,
  }
}
