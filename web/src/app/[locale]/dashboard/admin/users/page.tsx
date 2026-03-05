import {prisma} from '@/lib/prisma'
import {UsersTable} from './users-table'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes, match session idle timeout

type Props = {
  params: Promise<{locale: string}>
}

export default async function UsersPage({params}: Props) {
  const {locale} = await params
  const users = await prisma.user.findMany({
    orderBy: {createdAt: 'desc'},
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      sessions: {
        select: {updatedAt: true},
      },
    },
  })

  const now = Date.now()
  const rows = users.map(u => {
    const lastActivity =
      u.sessions.length > 0
        ? new Date(
            Math.max(...u.sessions.map(s => s.updatedAt.getTime())),
          ).toISOString()
        : null
    const isOnline =
      lastActivity != null &&
      now - new Date(lastActivity).getTime() < ONLINE_THRESHOLD_MS
    const lastActivityLabel =
      lastActivity != null
        ? `Last activity: ${new Date(lastActivity).toLocaleString(locale)}`
        : null
    const {sessions, ...rest} = u
    return {
      ...rest,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      lastActivity,
      lastActivityLabel,
      isOnline,
    }
  })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Users
      </h1>
      <UsersTable locale={locale} users={rows} />
    </div>
  )
}
