import { Lightbulb } from 'lucide-react'

export default function IdeasPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Lightbulb className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Ідеї</h1>
      <p className="mt-2 text-muted-foreground">Ідей поки немає. Запишіть першу ідею.</p>
    </div>
  )
}
