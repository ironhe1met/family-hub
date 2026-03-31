'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIdeas } from '@/features/ideas/hooks/use-ideas'
import { FullScreenEditor } from '@/components/full-screen-editor'

export default function NewIdeaPage() {
  const router = useRouter()
  const { createIdea } = useIdeas()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const idea = await createIdea({ title: title.trim(), description: description.trim() || undefined })
      router.push(`/ideas/${idea.id}`)
    } catch {
      setSaving(false)
    }
  }

  return (
    <FullScreenEditor
      title={title}
      onTitleChange={setTitle}
      content={description}
      onContentChange={setDescription}
      titlePlaceholder="Назва ідеї"
      contentPlaceholder="Опишіть вашу ідею... (підтримується Markdown)"
      onSave={handleSave}
      saving={saving}
      startEditing
      onClose={() => router.push('/ideas')}
    />
  )
}
