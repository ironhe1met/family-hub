'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, CheckSquare, CookingPot, FolderKanban, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { strings } from '@/lib/i18n'

const tabs = [
  { href: '/purchases', label: strings.navPurchases, icon: ShoppingCart },
  { href: '/tasks',     label: strings.navTasks,     icon: CheckSquare },
  { href: '/recipes',   label: strings.navRecipes,   icon: CookingPot },
  { href: '/projects',  label: strings.navProjects,  icon: FolderKanban },
  { href: '/ideas',     label: strings.navIdeas,     icon: Lightbulb },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-center gap-0.5">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-col items-center gap-[3px] rounded-md px-3 py-2 transition-all duration-200',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-primary/8'
            )}
          >
            <Icon className={cn('size-[18px] transition-transform duration-200', isActive && 'scale-110')} />
            <span className="text-[10px] font-medium tracking-wide leading-none">{label}</span>
            {isActive && (
              <span className="absolute -bottom-0.5 left-1/2 h-[2px] w-5 -translate-x-1/2 bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
