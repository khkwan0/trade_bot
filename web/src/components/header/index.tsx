'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function Header() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'en'

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--foreground)]/10 bg-[var(--background)]">
      <Link
        href={pathname?.startsWith(`/${locale}`) ? `/${locale}` : '/'}
        className="text-xl font-semibold text-[var(--foreground)] hover:opacity-80 transition-opacity"
      >
        Trade Bot
      </Link>
      {status === 'authenticated' && session && (
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          className="rounded-lg border border-[var(--foreground)]/30 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
        >
          Log out
        </button>
      )}
    </header>
  )
}
