'use client'

import { useState, useEffect, useCallback } from 'react'
import { recipeService, type RecipeListItem } from '../services/recipe-service'

export function useRecipes() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRecipes = useCallback(async () => {
    try {
      const data = await recipeService.list()
      setRecipes(data.recipes)
    } catch (err) {
      console.error('Fetch recipes error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRecipes() }, [fetchRecipes])

  const deleteRecipe = useCallback(async (id: string) => {
    await recipeService.delete(id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }, [])

  return { recipes, loading, deleteRecipe, fetchRecipes }
}
