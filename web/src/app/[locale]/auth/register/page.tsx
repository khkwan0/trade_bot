import { Suspense } from 'react'
import RegisterForm from './RegisterForm'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="h-80 w-full max-w-sm animate-pulse rounded-xl bg-[var(--foreground)]/5" />
        }
      >
        <RegisterForm locale={locale} />
      </Suspense>
    </main>
  )
}
