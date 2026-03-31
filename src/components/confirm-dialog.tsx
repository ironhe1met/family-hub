'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'destructive' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title = 'Підтвердження',
  message,
  confirmLabel = 'Видалити',
  cancelLabel = 'Скасувати',
  variant = 'destructive',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-outline-variant/30 bg-surface-container p-6 shadow-2xl">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${variant === 'destructive' ? 'bg-destructive/15' : 'bg-primary/15'}`}>
            <AlertTriangle className={`size-6 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
          </div>
        </div>

        {/* Text */}
        <h3 className="mb-2 text-center text-base font-semibold text-foreground">{title}</h3>
        <p className="mb-6 text-center text-sm text-muted-foreground">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="h-10 flex-1 rounded-lg border border-outline/30 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-container-high"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`h-10 flex-1 rounded-lg text-sm font-medium text-white transition-colors ${
              variant === 'destructive'
                ? 'bg-destructive hover:opacity-90'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
