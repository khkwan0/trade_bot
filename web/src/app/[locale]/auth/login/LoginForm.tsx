'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'

type Props = {
  callbackUrl?: string | null
  error?: string | null
}

const errorMessages: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password.',
  Default: 'Something went wrong. Please try again.',
}

export default function LoginForm({ callbackUrl, error: errorParam }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] ?? 'en'
  const callback = callbackUrl ?? searchParams.get('callbackUrl') ?? undefined
  const registered = searchParams.get('registered') === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(errorParam ?? null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let result: Awaited<ReturnType<typeof signIn>> | undefined
    try {
      result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: callback,
      })
    } catch (err) {
      setLoading(false)
      setError(errorMessages.Default)
      return
    }

    setLoading(false)

    if (result?.error) {
      setError(errorMessages[result.error] ?? errorMessages.Default)
      return
    }

    // No error = treat as success; redirect so the next request sends the session cookie
    const homePath = `/${locale}`
    let pathToOpen = homePath
    if (result?.url) {
      const target = result.url
      const origin = window.location.origin
      try {
        const u = new URL(target, origin)
        if (u.origin !== origin) {
          pathToOpen = homePath
        } else if (u.pathname === '/' || u.pathname === '') {
          pathToOpen = homePath
        } else {
          pathToOpen = u.pathname
        }
      } catch {
        pathToOpen = target.startsWith('/') ? target : homePath
      }
    } else {
      const safeCallback =
        callback && !/\/auth\/(login|register)(\/|$)/.test(callback)
          ? callback
          : undefined
      pathToOpen = safeCallback ?? homePath
    }
    window.location.assign(pathToOpen)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-sm space-y-6 rounded-xl border border-[var(--foreground)]/10 bg-[var(--background)] p-8 shadow-lg"
    >
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

      {error && (
        <div
          className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400"
          role="alert"
        >
          {error}
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--foreground)]/20 bg-transparent px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
            placeholder="you@example.com"
            disabled={loading}
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[var(--foreground)]/20 bg-transparent px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
            placeholder="••••••••"
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--foreground)] py-2.5 font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Signing in…' : 'Sign in'}
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
