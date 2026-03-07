import {GetUserExchangesByUserId} from '@/lib/exchanges'
import GetOpenOrders from '@/lib/exchanges/orders'
import {UserExchangeInfo} from '@/types/exchange-info'

type OrderRow = {symbol: string; amount: string; price: string}

function toOrderRows(orders: unknown): OrderRow[] {
  if (!orders) return []
  let list: unknown[] = Array.isArray(orders)
    ? orders
    : typeof orders === 'object' && orders !== null && 'open' in orders
      ? Object.values((orders as {open: Record<string, unknown>}).open ?? {})
      : typeof orders === 'object' && orders !== null
        ? Object.values(orders)
        : []
  return list
    .filter((o): o is Record<string, unknown> => o !== null && typeof o === 'object')
    .map(o => {
      const descr = (o.descr as Record<string, unknown>) ?? {}
      const symbol =
        (o.sym as string) ??
        (descr.pair as string) ??
        (o.symbol as string) ??
        (o.pair as string) ??
        '—'
      const amount =
        (o.amt as string) ??
        (o.vol as string) ??
        (o.amount as string) ??
        '—'
      const price =
        (o.rat as string) ??
        (o.rate as string) ??
        (o.price as string) ??
        '—'
      return {symbol: String(symbol), amount: String(amount), price: String(price)}
    })
}

export default async function OpenOrders({userId}: {userId: string}) {
  const exchanges = await GetUserExchangesByUserId(userId)
  const byExchange = await Promise.all(
    exchanges.map(async (exchange: UserExchangeInfo) => {
      const key = exchange.exchange_name.toLowerCase() as keyof typeof GetOpenOrders
      const fetcher = GetOpenOrders[key]
      const orders = fetcher ? await fetcher(exchange) : []
      return {exchangeName: exchange.exchange_name, orders}
    }),
  )

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Open Orders</h2>
      {byExchange.map(({exchangeName, orders}) => {
        const rows = toOrderRows(orders)
        if (rows.length === 0) return null
        return (
          <section key={exchangeName}>
            <h3 className="mb-2 font-medium text-muted-foreground">{exchangeName}</h3>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium">Symbol</th>
                    <th className="px-3 py-2 text-right font-medium">Amount</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2">{row.symbol}</td>
                      <td className="px-3 py-2 text-right">{row.amount}</td>
                      <td className="px-3 py-2 text-right">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
      {byExchange.every(({orders}) => toOrderRows(orders).length === 0) && (
        <p className="text-sm text-muted-foreground">No open orders.</p>
      )}
    </div>
  )
}
