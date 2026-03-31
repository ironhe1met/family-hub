'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, ChefHat, UtensilsCrossed } from 'lucide-react'
import { recipeService } from '@/features/recipes/services/recipe-service'

export default function NewRecipePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([{ name: '', quantity: '' }])
  const [saving, setSaving] = useState(false)

  const descRef = useRef<HTMLTextAreaElement>(null)
  const instrRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ;[descRef, instrRef].forEach((ref) => {
      const el = ref.current
      if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
    })
  }, [description, instructions])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { recipe } = await recipeService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() || undefined })),
      })
      router.push(`/recipes/${recipe.id}`)
    } catch { setSaving(false) }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 flex flex-col bg-background">
      <div className="lg:flex min-h-0 flex-1">
        {/* Center */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Назва рецепту"
              className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />

            <textarea ref={descRef} value={description}
              onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              placeholder="Короткий опис рецепту..."
              className="mb-6 min-h-[60px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />

            {/* Ingredients */}
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Інгредієнти</h2>
              </div>
              <div className="space-y-2">
                {ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={ing.name} onChange={(e) => { const next = [...ingredients]; next[i].name = e.target.value; setIngredients(next) }}
                      placeholder="Назва" className="h-8 flex-1 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                    <input value={ing.quantity} onChange={(e) => { const next = [...ingredients]; next[i].quantity = e.target.value; setIngredients(next) }}
                      placeholder="К-сть" className="h-8 w-28 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                    {ingredients.length > 1 && (
                      <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={() => setIngredients([...ingredients, { name: '', quantity: '' }])}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover">
                  <Plus className="size-3.5" />Додати інгредієнт
                </button>
              </div>
            </section>

            {/* Instructions */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ChefHat className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Інструкція</h2>
              </div>
              <textarea ref={instrRef} value={instructions}
                onChange={(e) => { setInstructions(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                placeholder="Покрокова інструкція... (підтримується Markdown)"
                className="min-h-[200px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            </section>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="space-y-5 p-5">
            <div className="space-y-0.5">
              <button onClick={handleSave} disabled={!title.trim() || saving}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50">
                {saving ? 'Створення...' : 'Створити рецепт'}
              </button>
              <div className="mt-2 border-t border-outline-variant/20 pt-2">
                <button onClick={() => router.push('/recipes')}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container">
                  <X className="size-4 text-muted-foreground" /> Закрити
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile save */}
      <div className="border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
        <button onClick={handleSave} disabled={!title.trim() || saving}
          className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50">
          {saving ? 'Створення...' : 'Створити рецепт'}
        </button>
      </div>
    </div>
  )
}
