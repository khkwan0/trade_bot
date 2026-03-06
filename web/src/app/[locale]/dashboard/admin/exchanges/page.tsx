import {prisma} from '@/lib/prisma'
import {ExchangesTable} from './exchanges-table'

type Props = {
  params: Promise<{locale: string}>
}

export default async function AdminExchangesPage({params}: Props) {
  await params
  const rows = await prisma.exchanges.findMany({
    orderBy: {name: 'asc'},
  })
  const entries = rows.map(r => ({
    id: r.id,
    name: r.name,
    url: r.url ?? null,
    active: r.active,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }))

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Exchanges
      </h1>
      <p className="text-sm text-[var(--foreground)]/70">
        Manage the global list of exchanges. Users link their API keys to these
        entries from the Exchanges dashboard.
      </p>
      <ExchangesTable entries={entries} />
    </div>
  )
}
