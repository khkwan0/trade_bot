import {prisma} from '@/lib/prisma'
import {WhitelistTable} from './whitelist-table'

type Props = {
  params: Promise<{locale: string}>
}

export default async function WhitelistPage({params}: Props) {
  await params
  const entries = await prisma.whitelist.findMany({
    orderBy: {created_at: 'asc'},
  })
  const rows = entries.map(e => ({
    email: e.email,
    createdAt: e.created_at.toISOString(),
    updatedAt: e.updated_at.toISOString(),
  }))

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Whitelist
      </h1>
      <p className="text-sm text-[var(--foreground)]/70">
        Add or remove email addresses allowed to register. Only whitelisted emails can sign up.
      </p>
      <WhitelistTable entries={rows} />
    </div>
  )
}
