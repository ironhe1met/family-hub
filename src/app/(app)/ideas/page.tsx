import { strings } from '@/lib/i18n'

export default function IdeasPage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-medium">{strings.ideasTitle}</h1>
      <p className="mt-2 text-muted-foreground text-sm">{strings.ideasPlaceholder}</p>
    </div>
  )
}
