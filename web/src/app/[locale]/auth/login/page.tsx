import { Suspense } from 'react'
import LoginForm from './LoginForm'

type Props = {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Suspense fallback={<div className="h-80 w-full max-w-sm animate-pulse rounded-xl bg-[var(--foreground)]/5" />}>
        <LoginForm
          error={params.error ?? null}
          callbackUrl={params.callbackUrl ?? null}
        />
      </Suspense>
    </main>
  )
}
