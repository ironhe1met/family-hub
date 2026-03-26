import { CookingPot } from 'lucide-react'
import { strings } from '@/lib/i18n'

export default function RecipesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-16 sm:px-6">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="rounded-md bg-primary/8 p-6">
          <CookingPot className="size-12 text-primary/40" />
        </div>
        <h1 className="text-xl font-medium">{strings.recipesTitle}</h1>
        <p className="text-sm text-muted-foreground">{strings.recipesPlaceholder}</p>
      </div>
    </div>
  )
}
