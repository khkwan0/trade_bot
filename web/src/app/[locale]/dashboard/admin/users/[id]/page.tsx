import {prisma} from '@/lib/prisma'
import {notFound} from 'next/navigation'
import {UserEditForm} from './user-edit-form'
import Link from 'next/link'

type Props = {
  params: Promise<{locale: string; id: string}>
}

export default async function UserEditPage({params}: Props) {
  const {locale, id} = await params
  const user = await prisma.user.findUnique({
    where: {id},
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isActive: true,
    },
  })

  if (!user) notFound()

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/dashboard/admin/users`}
          className="text-sm text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
        >
          ← Users
        </Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Edit user
      </h1>
      <UserEditForm
        locale={locale}
        user={{
          id: user.id,
          name: user.name ?? '',
          email: user.email,
          isAdmin: user.isAdmin,
          isActive: user.isActive,
        }}
      />
    </div>
  )
}
