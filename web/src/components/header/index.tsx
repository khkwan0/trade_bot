import Link from 'next/link'
import {redirect} from 'next/navigation'
import {auth, signOut} from '@/auth'
import Nav from '@/components/nav'

function maskEmail(email: string): string {
  const at = email.indexOf('@')
  if (at <= 0) return '***'
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const visible = local.length <= 2 ? local[0] ?? '' : local.slice(0, 2)
  return `${visible}***${domain}`
}

type Props = {
  locale: string
}

export default async function Header({locale}: Props) {
  const session = await auth()
  const showNav = Boolean(session?.user?.isActive)

  return (
    <div className="w-screen relative left-1/2 -ml-[50vw] border-b border-[var(--foreground)]/10 bg-[var(--background)]">
      <header className="flex flex-col gap-3 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${locale}`}
            className="text-lg sm:text-xl font-semibold text-[var(--foreground)] hover:opacity-80 transition-opacity min-h-[44px] min-w-[44px] flex items-center">
            Trade Bot
          </Link>
          {session && (
            <div className="flex items-center gap-3">
              {session.user?.email && (
                <span
                  className="text-sm text-[var(--foreground)]/70 truncate max-w-[180px] sm:max-w-none"
                  title={session.user.email}>
                  {maskEmail(session.user.email)}
                </span>
              )}
              <form action={logoutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--foreground)]/30 px-4 py-2.5 min-h-[44px] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)] [touch-action:manipulation]">
                  Log out
                </button>
              </form>
            </div>
          )}
        </div>
        <Nav locale={locale} show={showNav} isAdmin={session?.user?.isAdmin ?? false} />
      </header>
    </div>
  )
}

async function logoutAction(formData: FormData) {
  'use server'
  const locale = (formData.get('locale') as string) ?? 'en'
  await signOut({redirect: false})
  redirect(`/${locale}`)
}
