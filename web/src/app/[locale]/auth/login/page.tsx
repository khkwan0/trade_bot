import LoginForm from './LoginForm'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string; callbackUrl?: string; registered?: string }>
}

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params
  const query = await searchParams
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <LoginForm
        locale={locale}
        error={query.error ?? null}
        callbackUrl={query.callbackUrl ?? null}
        registered={query.registered === '1'}
      />
    </main>
  )
}
