import {redirect} from 'next/navigation'
import {auth} from '@/auth'
import {ExchangesClient} from './exchanges-client'

type Props = {
  params: Promise<{locale: string}>
}

export default async function ExchangesPage({params}: Props) {
  const {locale} = await params
  const session = await auth()

  if (!session?.user?.isActive || !session.user.id) {
    redirect(`/${locale}`)
  }

  return <ExchangesClient locale={locale} />
}
