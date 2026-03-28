import { ShoppingCart } from 'lucide-react'

export default function PurchasesPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShoppingCart className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Покупки</h1>
      <p className="mt-2 text-muted-foreground">Список порожній. Додайте перший товар.</p>
    </div>
  )
}
