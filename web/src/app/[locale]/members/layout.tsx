import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Header from '@/components/header'
import { authConfig } from '@/lib/auth.config'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function MembersLayout({ children, params }: Props) {
  const { locale } = await params
  const session = await auth()

  if (!session) {
    redirect(`/${locale}/auth/login?callbackUrl=/${locale}/members`)
  }

  return (
    <>
      <Header locale={locale} />
      <main>{children}</main>
    </>
  )
}
