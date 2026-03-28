import { FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FolderKanban className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Проєкти</h1>
      <p className="mt-2 text-muted-foreground">Проєктів поки немає. Створіть перший проєкт.</p>
    </div>
  )
}
