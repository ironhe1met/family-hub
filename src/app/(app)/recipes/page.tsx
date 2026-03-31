'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChefHat, Search, Trash2 } from 'lucide-react'
import { useConfirm } from '@/components/use-confirm'
import { useRecipes } from '@/features/recipes/hooks/use-recipes'
import type { RecipeListItem } from '@/features/recipes/services/recipe-service'

export default function RecipesPage() {
  const router = useRouter()
  const { recipes, loading, deleteRecipe } = useRecipes()
  const confirm = useConfirm()
  const [search, setSearch] = useState('')

  const filtered = search
    ? recipes.filter((r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description?.toLowerCase().includes(search.toLowerCase())
      )
    : recipes

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-md bg-surface-container" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-56 animate-pulse rounded-lg bg-surface-container/30" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Рецепти</h1>
        {recipes.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Пошук..."
              className="h-9 w-48 rounded-md border border-outline/30 bg-surface-container pl-9 pr-3 text-sm focus:border-primary focus:outline-none" />
          </div>
        )}
      </div>

      {recipes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ChefHat className="mb-4 size-16 text-muted-foreground/30" />
          <h2 className="text-lg font-medium">Рецептів поки немає</h2>
          <p className="mt-1 text-sm text-muted-foreground">Додайте перший рецепт</p>
          <button onClick={() => router.push('/recipes/new')}
            className="mt-4 h-10 rounded-full bg-primary px-6 text-sm font-medium text-on-primary hover:opacity-90">
            Додати рецепт
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe}
              onClick={() => router.push(`/recipes/${recipe.id}`)}
              onDelete={async () => { if (await confirm({ message: 'Ви впевнені, що хочете видалити рецепт?' })) deleteRecipe(recipe.id) }}
            />
          ))}
        </div>
      )}

      {filtered.length === 0 && recipes.length > 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">Нічого не знайдено</div>
      )}

      <button onClick={() => router.push('/recipes/new')}
        className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}

function RecipeCard({ recipe, onClick, onDelete }: { recipe: RecipeListItem; onClick: () => void; onDelete: () => void }) {
  return (
    <div onClick={onClick} className="group cursor-pointer overflow-hidden rounded-lg border border-outline-variant/20 bg-surface transition-colors hover:bg-surface-container/50">
      <div className="relative h-40 bg-surface-container">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center"><ChefHat className="size-12 text-muted-foreground/20" /></div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100">
          <Trash2 className="size-3.5" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground">{recipe.title}</h3>
        {recipe.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recipe.description}</p>}
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground/60">
          <span>{recipe.ingredientCount} інгредієнтів</span>
          <span>{recipe.createdBy.firstName}</span>
        </div>
      </div>
    </div>
  )
}
