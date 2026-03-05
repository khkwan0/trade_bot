import {prisma} from '@/lib/prisma'
import {Balance, ExchangeInfo} from '@/types/exchange-info'
import Balances from '@/lib/exchanges/balances'
import Prices from '@/lib/exchanges/prices'

function toExchangeInfo(row: {
  id: number
  name: string
  url: string | null
  api_key: string | null
  api_secret: string | null
}): ExchangeInfo {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? '',
    apiKey: row.api_key ?? undefined,
    apiSecret: row.api_secret ?? undefined,
  }
}

export const GetExchangeInfo = async (
  exchangeId: string,
): Promise<ExchangeInfo[] | null> => {
  if (exchangeId === 'all') {
    const rows = await prisma.exchanges.findMany()
    return rows.map(toExchangeInfo)
  }
  const id = parseInt(exchangeId, 10)
  if (Number.isNaN(id)) return null
  const row = await prisma.exchanges.findFirst({where: {id}})
  return row ? [toExchangeInfo(row)] : null
}

export const GetExchangesByUserId = async (userId: string) => {
  const rows = await prisma.exchanges.findMany({where: {user_id: userId}})
  return rows.map(toExchangeInfo)
}

export const GetPricesFromExchange = async (
  exchangeId: string,
  pairs: string[],
) => {
  const exchangeInfo = await GetExchangeInfo(exchangeId)
  if (!exchangeInfo) {
    throw new Error(`Exchange info not found for exchange id: ${exchangeId}`)
  }
  const response: Record<string, Record<string, number> | null> = {}
  for (const exchange of exchangeInfo) {
    response[exchange.name] = await Prices(exchange.name, pairs)
  }
  return response
}
/*
  const formUrls = new URL(exchangeInfo.url)
  formUrls.pathname = `/api/v3/ticker/price?symbol=${pairs.join(",")}`
  const prices = await fetch(formUrls.toString())
  const data = await prices.json()
  return data
  */

export const GetBalancesFromExchange = async (exchangeId: string) => {
  const exchangeInfo = await GetExchangeInfo(exchangeId)
  if (!exchangeInfo) {
    throw new Error(`Exchange info not found for exchange id: ${exchangeId}`)
  }
  const balances = await FetchBalancesFromExchange(exchangeInfo)
  return balances
}

export const FetchBalancesFromExchange = async (
  exchangeInfo: ExchangeInfo[],
): Promise<Record<string, Record<string, Balance> | null>> => {
  const response: Record<string, Record<string, Balance> | null> = {}
  for (const exchange of exchangeInfo) {
    const key = exchange.name.toLowerCase() as keyof typeof Balances
    if (!(key in Balances)) continue
    const balances = await Balances[key](exchange)
    response[exchange.name.toLowerCase()] = balances as Record<
      string,
      Balance
    > | null
  }
  return response
}
