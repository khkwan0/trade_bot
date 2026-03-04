import {redirect} from 'next/navigation'
import {auth} from '@/auth'
import Header from '@/components/header'

type Props = {
  children: React.ReactNode
  params: Promise<{locale: string}>
}

export default async function MembersLayout({children, params}: Props) {
  const {locale} = await params
  const session = await auth()

  if (!session || !session.user?.isActive) {
    redirect(`/${locale}`)
  }

  return (
    <>
      <Header locale={locale} />
      <main className="min-h-0 w-full py-6">{children}</main>
    </>
  )
}
