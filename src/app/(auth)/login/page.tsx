'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Помилка входу')
        return
      }

      router.push('/tasks')
      router.refresh()
    } catch {
      setError('Помилка з\'єднання з сервером')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15">
            <LogIn className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Family Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Увійдіть до свого акаунту</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Електронна пошта
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="h-11 w-full rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-11 w-full rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              placeholder="Мінімум 8 символів"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-full bg-primary font-medium text-on-primary transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

        {/* Register link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Немає акаунту?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  )
}
