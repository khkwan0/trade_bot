import { signIn } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  Default: 'Something went wrong. Please try again.',
}

type Props = {
  callbackUrl?: string | null
  error?: string | null
  registered?: boolean
  locale: string
}

export default function LoginForm({
  callbackUrl,
  error: errorParam,
  registered = false,
  locale,
}: Props) {
  return (
    <form
      action={loginAction}
      className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] p-8 shadow-lg"
    >
      <input type="hidden" name="locale" value={locale} />
      {callbackUrl != null && callbackUrl !== '' && (
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
      )}

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-[var(--foreground)]/70">
          Use your email and password to sign in.
        </p>
      </div>

      {registered && (
        <div
          className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
          role="status"
        >
          Account created. Sign in with your email and password.
        </div>
      )}

      {errorParam && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {errorMessages[errorParam] ?? errorMessages.Default}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-[var(--foreground)]/20 bg-transparent px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-lg border border-[var(--foreground)]/20 bg-transparent px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-[var(--foreground)] py-2.5 font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
      >
        Sign in
      </button>

      <p className="text-center text-sm text-[var(--foreground)]/70">
        Don&apos;t have an account?{' '}
        <Link
          href={`/${locale}/auth/register`}
          className="font-medium text-[var(--foreground)] underline hover:no-underline"
        >
          Create account
        </Link>
      </p>
    </form>
  )
}

async function loginAction(formData: FormData) {
  'use server'

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const locale = (formData.get('locale') as string) ?? 'en'
  const callbackUrl = (formData.get('callbackUrl') as string) ?? ''

  if (!email || !password) {
    redirect(buildLoginUrl(locale, 'Default', callbackUrl))
  }

  const result = await signIn('credentials', {
    email,
    password,
    redirect: false,
    callbackUrl: callbackUrl || undefined,
  })

  if (result?.error) {
    redirect(buildLoginUrl(locale, result.error, callbackUrl))
  }

  const homePath = `/${locale}`
  let pathToOpen = homePath

  if (result?.url) {
    try {
      const u = new URL(result.url, 'http://localhost')
      if (u.pathname === '/' || u.pathname === '') {
        pathToOpen = homePath
      } else {
        pathToOpen = u.pathname
      }
    } catch {
      pathToOpen = result.url.startsWith('/') ? result.url : homePath
    }
  } else {
    const safeCallback =
      callbackUrl && !/\/auth\/(login|register)(\/|$)/.test(callbackUrl)
        ? callbackUrl
        : undefined
    pathToOpen = safeCallback ?? homePath
  }

  redirect(pathToOpen)
}

function buildLoginUrl(locale: string, error: string, callbackUrl: string): string {
  const base = `/${locale}/auth/login`
  const params = new URLSearchParams()
  params.set('error', error)
  if (callbackUrl) params.set('callbackUrl', callbackUrl)
  return `${base}?${params.toString()}`
}
