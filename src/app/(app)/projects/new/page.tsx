'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { projectService } from '@/features/projects/services/project-service'

export default function NewProjectPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }
  }, [description])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const { project } = await projectService.create({ title: title.trim(), description: description.trim() || undefined })
      router.push(`/projects/${project.id}`)
    } catch { setSaving(false) }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 flex flex-col bg-background">
      <div className="lg:flex min-h-0 flex-1">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="Назва проєкту"
              className="mb-4 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
            <textarea ref={textareaRef} value={description}
              onChange={(e) => { setDescription(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
              placeholder="Опис проєкту... (підтримується Markdown)"
              className="min-h-[200px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none" />
          </div>
        </div>
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="space-y-5 p-5">
            <button onClick={handleSave} disabled={!title.trim() || saving}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50">
              {saving ? 'Створення...' : 'Створити проєкт'}
            </button>
            <div className="border-t border-outline-variant/20 pt-2">
              <button onClick={() => router.push('/projects')}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container">
                <X className="size-4 text-muted-foreground" /> Закрити
              </button>
            </div>
          </div>
        </aside>
      </div>
      <div className="border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
        <button onClick={handleSave} disabled={!title.trim() || saving}
          className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50">
          {saving ? 'Створення...' : 'Створити проєкт'}
        </button>
      </div>
    </div>
  )
}
