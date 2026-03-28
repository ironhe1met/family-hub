'use client'

import Link from 'next/link'
import { Bell, Settings, User } from 'lucide-react'
import { TopNav } from '@/components/nav/top-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Logo */}
          <Link href="/tasks" className="text-lg font-semibold text-foreground">
            Family Hub
          </Link>

          {/* Module Tabs */}
          <div className="hidden sm:block">
            <TopNav />
          </div>

          {/* Right: Notifications + Profile */}
          <div className="flex items-center gap-1">
            <button className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container">
              <Bell className="size-5" />
            </button>
            <Link
              href="/settings"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-surface-container"
            >
              <User className="size-5" />
            </Link>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="border-t border-outline-variant/20 px-2 sm:hidden">
          <TopNav />
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24">
        {children}
      </main>

      {/* FAB */}
      <button className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg glow-primary transition-transform hover:scale-105 active:scale-90">
        <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  )
}
