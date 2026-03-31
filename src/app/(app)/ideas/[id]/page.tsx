'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Pencil, Trash2, ListChecks, FolderKanban, User, Calendar } from 'lucide-react'
import { useConfirm } from '@/components/use-confirm'
import { useIdea } from '@/features/ideas/hooks/use-idea'
import { FullScreenEditor } from '@/components/full-screen-editor'

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { idea, loading, updateIdea, deleteIdea, convertIdea } = useIdea(id)
  const confirm = useConfirm()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync state from loaded idea (once)
  if (idea && !initialized) {
    setTitle(idea.title)
    setDescription(idea.description || '')
    setInitialized(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!idea) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Ідею не знайдено
      </div>
    )
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await updateIdea({ title: title.trim(), description: description.trim() || undefined })
    } catch {
      // keep open
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!await confirm({ message: 'Ви впевнені, що хочете видалити ідею?' })) return
    await deleteIdea()
    router.push('/ideas')
  }

  async function handleConvert(type: 'task' | 'project') {
    await convertIdea(type)
    router.push('/ideas')
  }

  const meta = [
    { label: 'Автор', value: idea.createdBy.firstName, icon: <User className="size-3.5" /> },
    { label: 'Створено', value: format(new Date(idea.createdAt), 'd MMM yyyy', { locale: uk }), icon: <Calendar className="size-3.5" /> },
    ...(idea.updatedAt !== idea.createdAt
      ? [{ label: 'Оновлено', value: format(new Date(idea.updatedAt), 'd MMM yyyy', { locale: uk }), icon: <Pencil className="size-3.5" /> }]
      : []),
  ]

  const docActions = [
    ...(!idea.convertedToType ? [
      { label: 'В задачу', icon: <ListChecks className="size-4" />, onClick: () => handleConvert('task') },
      { label: 'В проєкт', icon: <FolderKanban className="size-4" />, onClick: () => handleConvert('project') },
    ] : []),
    { label: 'Видалити', icon: <Trash2 className="size-4" />, onClick: handleDelete, variant: 'destructive' as const },
  ]

  return (
    <FullScreenEditor
      title={title}
      onTitleChange={setTitle}
      content={description}
      onContentChange={setDescription}
      titlePlaceholder="Назва ідеї"
      contentPlaceholder="Опишіть вашу ідею... (підтримується Markdown)"
      meta={meta}
      docActions={docActions}
      onSave={handleSave}
      saving={saving}
      onClose={() => router.push('/ideas')}
    />
  )
}
