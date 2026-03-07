import {auth} from '@/auth'
import MarketPriceFeed from '@/components/market-price-feed'
import Balances from '@/components/balances'
import OpenOrders from '@/components/open-orders'
import {prisma} from '@/lib/prisma'
import Prices from '@/lib/exchanges/prices'

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id ?? null

  const userExchanges =
    userId == null
      ? []
      : await prisma.user_exchanges.findMany({
          where: {user_id: userId, active: true},
          select: {
            exchange: {select: {name: true}},
            pairs: {
              where: {active: true},
              select: {base_currency: true, quote_currency: true},
            },
          },
        })

  const feedProps = userExchanges.map(ex => ({
    name: ex.exchange.name,
    pairSymbols: ex.pairs.map(p => `${p.base_currency}_${p.quote_currency}`),
  }))

  const feedData: Record<
    string,
    {data: Record<string, number> | null; error: string | null}
  > = {}
  for (const ex of feedProps) {
    const key = ex.name.toLowerCase()
    if (ex.pairSymbols.length === 0) {
      feedData[key] = {data: {}, error: null}
      continue
    }
    try {
      const data = await Prices(ex.name, ex.pairSymbols)
      feedData[key] = {data, error: null}
    } catch (e) {
      feedData[key] = {
        data: null,
        error: e instanceof Error ? e.message : String(e),
      }
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Dashboard
      </h1>
      <OpenOrders userId={userId} />
      <Balances userId={userId} />
      <MarketPriceFeed userExchanges={feedProps} feedData={feedData} />
    </div>
  )
}
