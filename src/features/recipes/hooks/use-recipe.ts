'use client'

import { useState, useEffect, useCallback } from 'react'
import { recipeService, type Recipe } from '../services/recipe-service'

export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    recipeService.getById(id)
      .then((data) => setRecipe(data.recipe))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const updateRecipe = useCallback(async (data: Parameters<typeof recipeService.update>[1]) => {
    const { recipe: updated } = await recipeService.update(id, data)
    setRecipe(updated)
    return updated
  }, [id])

  const deleteRecipe = useCallback(async () => {
    await recipeService.delete(id)
  }, [id])

  const uploadImage = useCallback(async (file: File) => {
    const { imageUrl } = await recipeService.uploadImage(id, file)
    setRecipe((prev) => prev ? { ...prev, imageUrl } : prev)
    return imageUrl
  }, [id])

  const toPurchases = useCallback(async (purchaseListId: string) => {
    return recipeService.toPurchases(id, purchaseListId)
  }, [id])

  return { recipe, loading, updateRecipe, deleteRecipe, uploadImage, toPurchases }
}
