'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingCart, CheckSquare, FolderKanban, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/purchases', label: 'Покупки', icon: ShoppingCart },
  { href: '/tasks',     label: 'Дела',    icon: CheckSquare },
  { href: '/projects',  label: 'Проекты', icon: FolderKanban },
  { href: '/ideas',     label: 'Идеи',    icon: Lightbulb },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-center gap-1">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex flex-col items-center gap-[3px] px-3 py-2 transition-colors duration-200',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground/55 hover:text-muted-foreground'
            )}
          >
            <Icon className={cn('size-[18px] transition-transform duration-200', isActive && 'scale-110')} />
            <span className="text-[10px] font-semibold tracking-wide leading-none">{label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
