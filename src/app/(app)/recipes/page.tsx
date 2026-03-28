import { ChefHat } from 'lucide-react'

export default function RecipesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ChefHat className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Рецепти</h1>
      <p className="mt-2 text-muted-foreground">Рецептів поки немає. Додайте перший рецепт.</p>
    </div>
  )
}
