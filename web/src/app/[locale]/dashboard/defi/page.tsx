import {redirect} from 'next/navigation'
import {auth} from '@/auth'
import {NetworksClient} from './networks-client'

type Props = {
  params: Promise<{locale: string}>
}

export default async function DefiPage({params}: Props) {
  const {locale} = await params
  const session = await auth()

  if (!session?.user?.isActive || !session.user.id) {
    redirect(`/${locale}`)
  }

  return <NetworksClient locale={locale} />
}
