'use client'

import Link from 'next/link'
import { Bell, Settings, User } from 'lucide-react'
import { TopNav } from '@/components/nav/top-nav'
import { ConfirmProvider } from '@/components/use-confirm'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header id="app-header" className="sticky top-0 z-40 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
        <div className="flex h-14 items-center px-4">
          {/* Logo — far left */}
          <Link href="/tasks" className="shrink-0 text-lg font-semibold text-foreground">
            Family Hub
          </Link>

          {/* Module Tabs — centered */}
          <div className="hidden flex-1 justify-center sm:flex">
            <TopNav />
          </div>

          {/* Right: Notifications + Profile — far right */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:ml-0">
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
        <ConfirmProvider>
          {children}
        </ConfirmProvider>
      </main>

    </div>
  )
}
