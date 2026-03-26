'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, Home, Settings, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { TopNav } from '@/components/top-nav'
import { strings } from '@/lib/i18n'

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8 shrink-0" />
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md
                 text-muted-foreground hover:bg-primary/8 hover:text-foreground
                 transition-all active:scale-90"
      aria-label={strings.changeTheme}
    >
      {resolvedTheme === 'dark'
        ? <Sun className="size-[16px]" />
        : <Moon className="size-[16px]" />}
    </button>
  )
}

function ProfileMenu({ email, initial }: { email: string; initial: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground
                   text-xs font-semibold hover:opacity-90 active:scale-90 transition">
        {initial}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-lg bg-surface-container-high p-1.5 shadow-lg border border-outline-variant/20">
          {/* Email */}
          <div className="px-3 py-2 text-xs text-muted-foreground truncate">{email}</div>
          <div className="h-px bg-outline-variant/20 my-1" />

          {/* Settings */}
          <button onClick={() => { setOpen(false); alert('Soon') }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-primary/8 transition">
            <Settings className="size-4 text-muted-foreground" />
            {strings.profileSettings}
          </button>

          {/* Logout */}
          <button onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition">
            <LogOut className="size-4" />
            {strings.profileLogout}
          </button>
        </div>
      )}
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
      else {
        setUserEmail(user.email ?? '')
        setChecking(false)
      }
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

  const initial = (userEmail[0] ?? '?').toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-outline-variant/20 bg-surface-container/90 backdrop-blur-xl">
        <div className="flex h-14 items-center gap-2 px-3">

          {/* Logo */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/12">
            <Home className="size-4 text-primary" />
          </div>

          {/* Nav — centered, takes remaining space */}
          <div className="flex-1 flex justify-center">
            <TopNav />
          </div>

          {/* Right: theme toggle + profile */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <ProfileMenu email={userEmail} initial={initial} />
          </div>

        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  )
}
