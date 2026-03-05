'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {useState, useRef, useEffect} from 'react'

type Props = {
  locale: string
  show: boolean
  isAdmin?: boolean
}

const links = [
  {href: '', label: 'Dashboard'},
  {href: 'exchanges', label: 'Exchanges'},
  {href: 'defi', label: 'Defi'},
  {href: 'telegram', label: 'Telegram'},
  {href: 'pairs', label: 'Pairs'},
  {href: 'settings', label: 'Settings'},
] as const

const adminLinks = [
  {href: 'users', label: 'Users'},
  {href: 'whitelist', label: 'Whitelist'},
] as const

export default function Nav({locale, show, isAdmin = false}: Props) {
  const pathname = usePathname()
  const base = `/${locale}/dashboard`
  const adminBase = `${base}/admin`
  const [adminOpen, setAdminOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setAdminOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  if (!show) return null

  const isAdminActive = pathname.startsWith(adminBase + '/') || pathname === adminBase

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
      {isAdmin && (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setAdminOpen((o) => !o)}
            aria-expanded={adminOpen}
            aria-haspopup="true"
            className={`rounded-lg px-3 py-2 min-h-[44px] inline-flex items-center text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)] [touch-action:manipulation] ${
              isAdminActive
                ? 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
                : 'text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]'
            }`}>
            Admin
            <svg
              className={`ml-1 h-4 w-4 transition-transform ${adminOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {adminOpen && (
            <ul
              className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-[var(--foreground)]/10 bg-[var(--background)] py-1 shadow-lg"
              role="menu">
              {adminLinks.map(({href, label}) => {
                const path = `${adminBase}/${href}`
                const isActive = pathname === path || pathname.startsWith(path + '/')
                return (
                  <li key={href} role="none">
                    <Link
                      href={path}
                      role="menuitem"
                      onClick={() => setAdminOpen(false)}
                      className={`block px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-[var(--foreground)]/10 text-[var(--foreground)]'
                          : 'text-[var(--foreground)]/80 hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]'
                      }`}>
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </nav>
  )
}
