import {NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'
import Prices from '@/lib/exchanges/prices'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const userExchanges = await prisma.user_exchanges.findMany({
    where: {user_id: session.user.id, active: true},
    select: {
      exchange: {select: {name: true}},
      pairs: {
        where: {active: true},
        select: {base_currency: true, quote_currency: true},
      },
    },
  })

  const feeds: Record<
    string,
    {data: Record<string, number> | null; error: string | null}
  > = {}

  for (const ex of userExchanges) {
    const key = ex.exchange.name.toLowerCase()
    const pairSymbols = ex.pairs.map(
      p => `${p.base_currency}_${p.quote_currency}`,
    )
    if (pairSymbols.length === 0) {
      feeds[key] = {data: {}, error: null}
      continue
    }
    try {
      const data = await Prices(ex.exchange.name, pairSymbols)
      feeds[key] = {data, error: null}
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      feeds[key] = {data: null, error: message}
    }
  }

  const totalFeeds =
    Object.keys(feeds).length === 0
      ? 0
      : Object.keys(feeds).reduce(
          (acc, curr) =>
            acc + (Object.keys(feeds[curr]?.data ?? {}).length ?? 0),
          0,
        )
  if (totalFeeds < 3) {
    const binanceData = await Prices('binance', [
      'BTC_USDC',
      'ETH_USDC',
      'SOL_USDC',
    ])
    feeds['binance'] = {data: binanceData, error: null}
  }
  console.log('feeds', feeds)
  return NextResponse.json(feeds)
}
