import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"

type Props = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: Props) {
  const { locale } = await params
  const session = await getServerSession(authConfig)

  if (session) {
    redirect(`/${locale}/members`)
  }

  const loginHref = `/${locale}/auth/login`
  const registerHref = `/${locale}/auth/register`

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-[var(--background)] to-[var(--foreground)]/5">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--foreground)]">
          Welcome to Trade Bot
        </h1>
        <p className="text-lg text-[var(--foreground)]/80">
          Manage your trading strategies and stay on top of the markets.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={loginHref}
            className="inline-flex items-center justify-center rounded-lg bg-[var(--foreground)] text-[var(--background)] px-6 py-3 text-base font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          >
            Sign in
          </Link>
          <Link
            href={registerHref}
            className="inline-flex items-center justify-center rounded-lg border border-[var(--foreground)]/30 text-[var(--foreground)] px-6 py-3 text-base font-medium hover:bg-[var(--foreground)]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}
