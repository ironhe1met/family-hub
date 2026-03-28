'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ListChecks,
  FolderKanban,
  ShoppingCart,
  ChefHat,
  Wallet,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { strings } from '@/lib/i18n'

const locale = 'uk' as const

const modules = [
  { href: '/tasks', label: strings[locale].navTasks, icon: ListChecks },
  { href: '/projects', label: strings[locale].navProjects, icon: FolderKanban },
  { href: '/purchases', label: strings[locale].navPurchases, icon: ShoppingCart },
  { href: '/recipes', label: strings[locale].navRecipes, icon: ChefHat },
  { href: '/budget', label: strings[locale].navBudget, icon: Wallet },
  { href: '/ideas', label: strings[locale].navIdeas, icon: Lightbulb },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto px-1 py-1 scrollbar-none">
      {modules.map((mod) => {
        const isActive = pathname.startsWith(mod.href)
        const Icon = mod.icon
        return (
          <Link
            key={mod.href}
            href={mod.href}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/15 text-primary glow-primary-sm'
                : 'text-muted-foreground hover:bg-surface-container'
            )}
          >
            <Icon className="size-4" />
            <span>{mod.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
