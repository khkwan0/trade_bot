import {
  GetUserExchangesByUserId,
  FetchBalancesFromUserExchanges,
} from '@/lib/exchanges'
import type {Balance} from '@/types/exchange-info'
import {BalancesReveal} from './balances-reveal'

type Props = {
  userId?: string | null
}

export default async function Balances({userId}: Props) {
  if (!userId) {
    return (
      <p className="text-sm text-[var(--muted-foreground)] mt-4">
        Sign in to view balances.
      </p>
    )
  }

  const exchanges = await GetUserExchangesByUserId(userId)
  if (exchanges.length === 0) {
    return (
      <section className="mt-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
          Balances
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          No exchanges linked. Add an exchange to see balances.
        </p>
      </section>
    )
  }

  const balancesByExchange = await FetchBalancesFromUserExchanges(exchanges)
  const entries = Object.entries(balancesByExchange).filter(
    (entry): entry is [string, Record<string, Balance>] => entry[1] != null,
  )

  if (entries.length === 0) {
    return (
      <section className="mt-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
          Balances
        </h2>
        <p className="text-sm text-[var(--muted-foreground)]">
          Unable to load balances from your exchanges.
        </p>
      </section>
    )
  }

  return <BalancesReveal entries={entries} />
}
