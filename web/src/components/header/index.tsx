import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth, signOut } from '@/auth'

type Props = {
  locale: string
}

export default async function Header({ locale }: Props) {
  const session = await auth()

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--foreground)]/10 bg-[var(--background)]">
      <Link
        href={`/${locale}`}
        className="text-xl font-semibold text-[var(--foreground)] hover:opacity-80 transition-opacity"
      >
        Trade Bot
      </Link>
      {session && (
        <form action={logoutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="rounded-lg border border-[var(--foreground)]/30 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          >
            Log out
          </button>
        </form>
      )}
    </header>
  )
}

async function logoutAction(formData: FormData) {
  'use server'
  const locale = (formData.get('locale') as string) ?? 'en'
  await signOut({ redirect: false })
  redirect(`/${locale}/auth/login`)
}
