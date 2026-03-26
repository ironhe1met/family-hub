'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopNav } from '@/components/top-nav'
import { strings } from '@/lib/i18n'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9 shrink-0" />
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md
                 text-muted-foreground hover:bg-primary/8 hover:text-foreground
                 transition-all active:scale-90"
      aria-label={strings.changeTheme}
    >
      {resolvedTheme === 'dark'
        ? <Sun className="size-[18px]" />
        : <Moon className="size-[18px]" />}
    </button>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
      else setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace('/login')
    })
    return () => subscription.unsubscribe()
  }, [router])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── MD3 Top App Bar ── */}
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface-container/90 backdrop-blur-xl">
        <div className="grid h-14 grid-cols-[40px_1fr_40px] items-center px-2">

          {/* Logo */}
          <div className="flex items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/12">
              <Home className="size-4 text-primary" />
            </div>
          </div>

          {/* Nav */}
          <TopNav />

          {/* Theme toggle */}
          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>

        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
