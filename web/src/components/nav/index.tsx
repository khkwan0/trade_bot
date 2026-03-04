'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'

type Props = {
  locale: string
  show: boolean
}

const links = [
  {href: '', label: 'Dashboard'},
  {href: 'exchanges', label: 'Exchanges'},
  {href: 'defi', label: 'Defi'},
  {href: 'telegram', label: 'Telegram'},
  {href: 'pairs', label: 'Pairs'},
  {href: 'settings', label: 'Settings'},
] as const

export default function Nav({locale, show}: Props) {
  const pathname = usePathname()
  const base = `/${locale}/dashboard`

  if (!show) return null

  return (
    <nav
      className="flex flex-wrap items-center gap-1 sm:gap-2"
      aria-label="Main navigation">
      {links.map(({href, label}) => {
        const path = href ? `${base}/${href}` : base
        const isActive =
          path === base
            ? pathname === base || pathname === base + '/'
            : pathname === path || pathname.startsWith(path + '/')
        return (
          <Link
            key={href}
            href={path}
            className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)] [touch-action:manipulation] ${
              isActive
                ? 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
                : 'text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]'
            }`}>
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
