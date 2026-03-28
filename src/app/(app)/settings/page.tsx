import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Settings className="mb-4 size-16 text-muted-foreground/30" />
      <h1 className="text-2xl font-semibold">Налаштування</h1>
      <p className="mt-2 text-muted-foreground">Профіль, сім'я, тема, мова.</p>
    </div>
  )
}
