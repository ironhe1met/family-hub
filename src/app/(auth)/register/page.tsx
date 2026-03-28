'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus } from 'lucide-react'

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('invite')

  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inviteFamily, setInviteFamily] = useState<string | null>(null)

  // If invite code, fetch family name
  useEffect(() => {
    if (!inviteCode) return
    // We'll just show the code — family name will be revealed after registration
    setInviteFamily(inviteCode)
  }, [inviteCode])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url = inviteCode
        ? '/api/v1/auth/register-invite'
        : '/api/v1/auth/register'

      const body = inviteCode
        ? { email, password, firstName, inviteCode }
        : { email, password, firstName, familyName }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Помилка реєстрації')
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
            <UserPlus className="size-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Family Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inviteFamily
              ? `Приєднуєтесь за запрошенням: ${inviteFamily}`
              : 'Створіть акаунт для вашої сім\'ї'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Ім&apos;я
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="h-11 w-full rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              placeholder="Олександр"
            />
          </div>

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
              autoComplete="new-password"
              className="h-11 w-full rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              placeholder="Мінімум 8 символів"
            />
          </div>

          {!inviteCode && (
            <div>
              <label htmlFor="familyName" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Назва сім&apos;ї
              </label>
              <input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                className="h-11 w-full rounded-md border border-outline/30 bg-surface-container px-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
                placeholder="Сім'я Петренко"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-full bg-primary font-medium text-on-primary transition-transform hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Вже є акаунт?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Увійти
          </Link>
        </p>
      </div>
    </div>
  )
}
