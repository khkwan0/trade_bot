import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'
import {redirect} from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/')
  }
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  })

  if (!user?.isAdmin) {
    redirect('/')
  }
  return <div>{children}</div>
}
