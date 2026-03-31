'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import {
  X, Pencil, Save, Trash2, User, Calendar, ChefHat, ShoppingCart,
  Plus, ImagePlus, UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConfirm } from '@/components/use-confirm'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { useRecipe } from '@/features/recipes/hooks/use-recipe'
import { purchaseService } from '@/features/purchases/services/purchase-service'

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { recipe, loading, updateRecipe, deleteRecipe, uploadImage, toPurchases } = useRecipe(id)
  const confirm = useConfirm()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [ingredients, setIngredients] = useState<{ name: string; quantity: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [mobileTab, setMobileTab] = useState<'content' | 'info'>('content')

  // For "to purchases" action
  const [purchaseLists, setPurchaseLists] = useState<{ id: string; name: string }[]>([])
  const [showPurchaseSelect, setShowPurchaseSelect] = useState(false)

  const descRef = useRef<HTMLTextAreaElement>(null)
  const instrRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    purchaseService.getLists().then((d) => setPurchaseLists(d.lists.map((l) => ({ id: l.id, name: l.name })))).catch(() => {})
  }, [])

  if (recipe && !initialized) {
    setTitle(recipe.title)
    setDescription(recipe.description || '')
    setInstructions(recipe.instructions || '')
    setIngredients(recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity || '' })))
    setInitialized(true)
  }

  // Auto-resize textareas
  useEffect(() => {
    if (!editing) return
    ;[descRef, instrRef].forEach((ref) => {
      const el = ref.current
      if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
    })
  }, [description, instructions, editing])

  const handleSave = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateRecipe({
        title: title.trim(),
        description: description.trim() || undefined,
        instructions: instructions.trim() || undefined,
        ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({ name: i.name.trim(), quantity: i.quantity.trim() || undefined })),
      })
      setEditing(false)
    } catch { /* keep */ }
    finally { setSaving(false) }
  }, [title, description, instructions, ingredients, updateRecipe])

  const handleDelete = useCallback(async () => {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити рецепт?' })) return
    await deleteRecipe(); router.push('/recipes')
  }, [deleteRecipe, router])

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadImage(file)
  }, [uploadImage])

  const handleToPurchases = useCallback(async (listId: string) => {
    try {
      const result = await toPurchases(listId)
      setShowPurchaseSelect(false)
      alert(`Додано ${result.addedCount} інгредієнтів до списку покупок`)
    } catch {
      alert('Помилка додавання в покупки')
    }
  }, [toPurchases])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
  }
  if (!recipe) {
    return <div className="py-20 text-center text-sm text-muted-foreground">Рецепт не знайдено</div>
  }

  // ── Right sidebar ──
  const sidebarContent = (
    <div className="space-y-5">
      {/* Image */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Фото</div>
        <div className="relative h-36 overflow-hidden rounded-lg bg-surface-container">
          {recipe.imageUrl ? (
            <img src={recipe.imageUrl} alt={recipe.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center"><ChefHat className="size-10 text-muted-foreground/20" /></div>
          )}
          <button onClick={() => imageInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all hover:bg-black/40 hover:opacity-100">
            <ImagePlus className="size-6" />
          </button>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      </div>

      {/* To purchases */}
      <div>
        <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Інгредієнти → Покупки</div>
        {showPurchaseSelect ? (
          <div className="space-y-1">
            {purchaseLists.map((l) => (
              <button key={l.id} onClick={() => handleToPurchases(l.id)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-surface-container">
                <ShoppingCart className="size-3.5 text-muted-foreground" />{l.name}
              </button>
            ))}
            {purchaseLists.length === 0 && <p className="text-xs text-muted-foreground">Немає списків покупок</p>}
            <button onClick={() => setShowPurchaseSelect(false)} className="text-xs text-muted-foreground hover:text-foreground">Скасувати</button>
          </div>
        ) : (
          <button onClick={() => setShowPurchaseSelect(true)}
            className="flex w-full items-center gap-2 rounded-md border border-outline/30 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container">
            <ShoppingCart className="size-4 text-muted-foreground" />В покупки ({recipe.ingredients.length} інгр.)
          </button>
        )}
      </div>

      {/* Details */}
      <div className="border-t border-outline-variant/20 pt-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Деталі</h3>
        <div className="space-y-2.5">
          <DetailRow icon={<User className="size-3.5" />} label="Автор" value={recipe.createdBy.firstName} />
          <DetailRow icon={<UtensilsCrossed className="size-3.5" />} label="Інгредієнтів" value={String(recipe.ingredients.length)} />
          <DetailRow icon={<Calendar className="size-3.5" />} label="Створено" value={format(new Date(recipe.createdAt), 'd MMM yyyy', { locale: uk })} />
          {recipe.updatedAt !== recipe.createdAt && (
            <DetailRow icon={<Pencil className="size-3.5" />} label="Оновлено" value={format(new Date(recipe.updatedAt), 'd MMM yyyy', { locale: uk })} />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-outline-variant/20 pt-4">
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Дії</h3>
        <div className="space-y-0.5">
          {editing ? (
            <>
              <ActionBtn icon={<Pencil className="size-4 text-muted-foreground" />} label="Перегляд" onClick={() => setEditing(false)} />
              <ActionBtn icon={<Save className="size-4" />} label={saving ? 'Збереження...' : 'Зберегти'} onClick={handleSave} className="text-primary hover:bg-primary/10" />
            </>
          ) : (
            <ActionBtn icon={<Pencil className="size-4 text-muted-foreground" />} label="Редагувати" onClick={() => setEditing(true)} />
          )}
          <ActionBtn icon={<Trash2 className="size-4" />} label="Видалити" onClick={handleDelete} className="text-destructive hover:bg-destructive/10" />
          <div className="mt-2 border-t border-outline-variant/20 pt-2">
            <ActionBtn icon={<X className="size-4 text-muted-foreground" />} label="Закрити" onClick={() => router.push('/recipes')} />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 flex flex-col bg-background">
      {/* Mobile tabs */}
      <div className="border-b border-outline-variant/20 lg:hidden">
        <div className="flex">
          <button onClick={() => setMobileTab('content')} className={cn('flex-1 py-2.5 text-center text-sm font-medium', mobileTab === 'content' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Вміст</button>
          <button onClick={() => setMobileTab('info')} className={cn('flex-1 py-2.5 text-center text-sm font-medium', mobileTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground')}>Інфо</button>
        </div>
      </div>

      {mobileTab === 'info' && <div className="flex-1 overflow-y-auto p-4 lg:hidden">{sidebarContent}</div>}

      <div className={cn('flex min-h-0 flex-1', mobileTab === 'info' && 'hidden lg:flex')}>
        {/* Center */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {/* Title */}
            {editing ? (
              <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Назва рецепту"
                className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            ) : (
              <h1 className="mb-4 text-3xl font-bold text-foreground">{title}</h1>
            )}

            {/* Description */}
            {editing ? (
              <textarea ref={descRef} value={description}
                onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                placeholder="Короткий опис рецепту..."
                className="mb-6 min-h-[60px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            ) : description ? (
              <div className="mb-6"><MarkdownRenderer content={description} /></div>
            ) : null}

            {/* Ingredients */}
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <UtensilsCrossed className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Інгредієнти</h2>
              </div>

              {editing ? (
                <div className="space-y-2">
                  {ingredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={ing.name} onChange={(e) => { const next = [...ingredients]; next[i].name = e.target.value; setIngredients(next) }}
                        placeholder="Назва" className="h-8 flex-1 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                      <input value={ing.quantity} onChange={(e) => { const next = [...ingredients]; next[i].quantity = e.target.value; setIngredients(next) }}
                        placeholder="К-сть" className="h-8 w-28 rounded-md border border-outline/30 bg-surface-container px-2 text-sm focus:border-primary focus:outline-none" />
                      <button onClick={() => setIngredients(ingredients.filter((_, j) => j !== i))}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setIngredients([...ingredients, { name: '', quantity: '' }])}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover">
                    <Plus className="size-3.5" />Додати інгредієнт
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {recipe.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center gap-3 text-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      <span className="text-foreground">{ing.name}</span>
                      {ing.quantity && <span className="text-muted-foreground">{ing.quantity}</span>}
                    </div>
                  ))}
                  {recipe.ingredients.length === 0 && <p className="text-xs text-muted-foreground/50 italic">Інгредієнтів немає</p>}
                </div>
              )}
            </section>

            {/* Instructions */}
            <section>
              <div className="mb-3 flex items-center gap-2">
                <ChefHat className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Інструкція</h2>
              </div>

              {editing ? (
                <textarea ref={instrRef} value={instructions}
                  onChange={(e) => { setInstructions(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
                  placeholder="Покрокова інструкція... (підтримується Markdown)"
                  className="min-h-[200px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
              ) : (
                <MarkdownRenderer content={instructions} />
              )}
            </section>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="p-5">{sidebarContent}</div>
        </aside>
      </div>

      {/* Mobile save */}
      {editing && mobileTab === 'content' && (
        <div className="border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
          <button onClick={handleSave} disabled={!title.trim() || saving}
            className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50">
            {saving ? 'Збереження...' : 'Зберегти'}
          </button>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="shrink-0 text-muted-foreground/50">{icon}</span>
      <span className="shrink-0 text-muted-foreground/60">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, className }: { icon: React.ReactNode; label: string; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick}
      className={cn('flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container', className)}>
      <span className="shrink-0">{icon}</span>{label}
    </button>
  )
}
