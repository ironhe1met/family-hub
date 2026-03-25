'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, CheckSquare, FolderKanban, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/purchases', label: 'Покупки', icon: ShoppingCart },
  { href: '/tasks', label: 'Дела', icon: CheckSquare },
  { href: '/projects', label: 'Проекты', icon: FolderKanban },
  { href: '/ideas', label: 'Идеи', icon: Lightbulb },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-6" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
