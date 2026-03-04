import {redirect} from 'next/navigation'
import {auth} from '@/auth'
import {PairsClient} from './pairs-client'

type Props = {
  params: Promise<{locale: string}>
}

export default async function PairsPage({params}: Props) {
  const {locale} = await params
  const session = await auth()

  if (!session?.user?.isActive || !session.user.id) {
    redirect(`/${locale}`)
  }

  return <PairsClient locale={locale} />
}
