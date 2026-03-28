import { ListChecks } from 'lucide-react'

export default function TasksPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ListChecks className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Задачі</h1>
      <p className="mt-2 text-muted-foreground">Задач поки немає. Створіть першу задачу.</p>
    </div>
  )
}
