'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Pencil, Eye, Save } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer, extractHeadings } from '@/components/markdown-renderer'

export interface DocMeta {
  label: string
  value: string
  icon?: React.ReactNode
}

export interface DocAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive'
}

interface FullScreenEditorProps {
  title: string
  onTitleChange: (value: string) => void
  content: string
  onContentChange: (value: string) => void
  titlePlaceholder?: string
  contentPlaceholder?: string
  meta?: DocMeta[]
  docActions?: DocAction[]
  onSave?: () => void
  saving?: boolean
  readOnly?: boolean
  startEditing?: boolean
  onClose: () => void
}

export function FullScreenEditor({
  title,
  onTitleChange,
  content,
  onContentChange,
  titlePlaceholder = 'Назва',
  contentPlaceholder = 'Почніть писати... (підтримується Markdown)',
  meta = [],
  docActions = [],
  onSave,
  saving = false,
  readOnly = false,
  startEditing = false,
  onClose,
}: FullScreenEditorProps) {
  const [editing, setEditing] = useState(startEditing)
  const [mobileTab, setMobileTab] = useState<'content' | 'info'>('content')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const headings = useMemo(() => extractHeadings(content), [content])
  const hasToc = headings.length > 0

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (editing) setEditing(false)
        else onClose()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, editing])

  useEffect(() => {
    const el = textareaRef.current
    if (el && editing) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [content, editing])

  function handleSave() {
    onSave?.()
    setEditing(false)
  }

  function scrollToHeading(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[var(--header-height)] z-30 flex flex-col bg-background">

      {/* ── Mobile tabs ── */}
      <div className="border-b border-outline-variant/20 lg:hidden">
        <div className="flex">
          <button
            onClick={() => setMobileTab('content')}
            className={cn(
              'flex-1 py-2.5 text-center text-sm font-medium transition-colors',
              mobileTab === 'content' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            Вміст
          </button>
          <button
            onClick={() => setMobileTab('info')}
            className={cn(
              'flex-1 py-2.5 text-center text-sm font-medium transition-colors',
              mobileTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'
            )}
          >
            Інфо
          </button>
        </div>
      </div>

      {/* ── Mobile: info tab ── */}
      {mobileTab === 'info' && (
        <div className="space-y-6 p-4 lg:hidden">
          <SidebarDetails meta={meta} />
          <SidebarActions
            editing={editing}
            readOnly={readOnly}
            saving={saving}
            titleEmpty={!title.trim()}
            onEdit={() => { setEditing(true); setMobileTab('content') }}
            onPreview={() => setEditing(false)}
            onSave={handleSave}
            onClose={onClose}
            docActions={docActions}
          />
        </div>
      )}

      {/* ── Desktop 3-column layout / Mobile content ── */}
      <div className={cn('flex min-h-0 flex-1', mobileTab === 'info' && 'hidden lg:flex')}>

        {/* Left: TOC (empty placeholder when editing to keep width stable) */}
        {hasToc && (
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-outline-variant/20 lg:block">
            {!editing && (
              <div className="p-5">
                <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Навігація
                </h3>
                <nav className="space-y-1">
                  {headings.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToHeading(h.id)}
                      className="block w-full truncate text-left text-xs leading-relaxed text-primary/80 hover:text-primary"
                      style={{ paddingLeft: `${(h.level - 1) * 10}px` }}
                    >
                      {h.text}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </aside>
        )}

        {/* Center: content — takes all remaining space */}
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="px-6 py-6">
            {editing ? (
              <input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={titlePlaceholder}
                autoFocus
                className="mb-6 w-full bg-transparent text-3xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
              />
            ) : (
              <h1 className="mb-6 text-3xl font-bold text-foreground">
                {title || <span className="text-muted-foreground/30">{titlePlaceholder}</span>}
              </h1>
            )}

            {editing ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder={contentPlaceholder}
                className="min-h-[60vh] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
              />
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        </div>

        {/* Right: details + actions */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-outline-variant/20 lg:block">
          <div className="p-5">
            <SidebarDetails meta={meta} />
            <SidebarActions
              editing={editing}
              readOnly={readOnly}
              saving={saving}
              titleEmpty={!title.trim()}
              onEdit={() => setEditing(true)}
              onPreview={() => setEditing(false)}
              onSave={handleSave}
              onClose={onClose}
              docActions={docActions}
            />
          </div>
        </aside>
      </div>

      {/* ── Mobile: save button ── */}
      {editing && mobileTab === 'content' && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/20 bg-surface/95 p-3 backdrop-blur-md lg:hidden">
          <button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="h-10 w-full rounded-full bg-primary text-sm font-medium text-on-primary disabled:opacity-50"
          >
            {saving ? 'Збереження...' : 'Зберегти сторінку'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ──

function SidebarDetails({ meta }: { meta: DocMeta[] }) {
  if (meta.length === 0) return null
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Деталі
      </h3>
      <div className="space-y-2.5">
        {meta.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            {item.icon && <span className="shrink-0 text-muted-foreground/50">{item.icon}</span>}
            <span className="shrink-0 text-muted-foreground/60">{item.label}:</span>
            <span className="text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SidebarActions({ editing, readOnly, saving, titleEmpty, onEdit, onPreview, onSave, onClose, docActions }: {
  editing: boolean
  readOnly: boolean
  saving: boolean
  titleEmpty: boolean
  onEdit: () => void
  onPreview: () => void
  onSave: () => void
  onClose: () => void
  docActions: DocAction[]
}) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        Дії
      </h3>
      <div className="space-y-0.5">
        {!readOnly && (
          editing ? (
            <>
              <ActionBtn icon={<Eye className="size-4 text-muted-foreground" />} label="Перегляд" onClick={onPreview} />
              <ActionBtn
                icon={<Save className="size-4" />}
                label={saving ? 'Збереження...' : 'Зберегти'}
                onClick={onSave}
                disabled={titleEmpty || saving}
                className="text-primary hover:bg-primary/10"
              />
            </>
          ) : (
            <ActionBtn icon={<Pencil className="size-4 text-muted-foreground" />} label="Редагувати" onClick={onEdit} />
          )
        )}

        {docActions.map((action, i) => (
          <ActionBtn
            key={i}
            icon={action.icon}
            label={action.label}
            onClick={action.onClick}
            className={action.variant === 'destructive' ? 'text-destructive hover:bg-destructive/10' : undefined}
          />
        ))}

        {/* Close / back */}
        <div className="mt-2 border-t border-outline-variant/20 pt-2">
          <ActionBtn icon={<X className="size-4 text-muted-foreground" />} label="Закрити" onClick={onClose} />
        </div>
      </div>
    </div>
  )
}

function ActionBtn({ icon, label, onClick, disabled, className }: {
  icon?: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-container disabled:opacity-50',
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label}
    </button>
  )
}
