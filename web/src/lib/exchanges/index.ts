import {prisma} from '@/lib/prisma'
import {Balance, ExchangeInfo, UserExchangeInfo} from '@/types/exchange-info'
import Balances from '@/lib/exchanges/balances'
import Prices from '@/lib/exchanges/prices'
import {logger} from '@/lib/logger'

function toUserExchangeInfo(row: {
  id: number
  user_id: string
  exchange_id: number
  api_key: string | null
  api_secret: string | null
  active: boolean
  created_at: Date
  updated_at: Date
  exchange: {name: string; url: string | null}
}): UserExchangeInfo {
  return {
    id: row.id,
    user_id: row.user_id,
    exchange_id: row.exchange_id,
    exchange_name: row.exchange.name,
    exchange_url: row.exchange.url ?? null,
    api_key: row.api_key ?? null,
    api_secret: row.api_secret ?? null,
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function toExchangeInfo(row: {
  id: number
  name: string
  url: string | null
  active: boolean
  created_at: Date
  updated_at: Date
}): ExchangeInfo {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? null,
    active: row.active,
    created_at: row.created_at,
    updated_at: row.updated_at,
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

type UserExchangeWithExchange = {
  id: number
  user_id: string
  exchange_id: number
  api_key: string | null
  api_secret: string | null
  maker_fee: number
  taker_fee: number
  active: boolean
  created_at: Date
  updated_at: Date
  exchange: {name: string; url: string | null}
}

export const GetUserExchangesByUserId = async (userId: string) => {
  const rows = await prisma.user_exchanges.findMany({
    where: {
      user_id: userId,
      exchange: {}, // inner join: only rows with a matching exchange
    },
    include: {exchange: {select: {name: true, url: true}}},
  } as Parameters<typeof prisma.user_exchanges.findMany>[0])
  return (rows as UserExchangeWithExchange[]).map(toUserExchangeInfo)
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

// this is called through a telegram callback
export const GetBalancesFromExchange = async (
  exchangeId: string,
  userId: string,
) => {
  const userExchanges = await GetUserExchangesByUserId(userId)
  if (exchangeId === 'all') {
    const balances = await FetchBalancesFromUserExchanges(userExchanges)
    return balances
  }

  const exchangeIdNumber = Number(exchangeId)
  if (Number.isNaN(exchangeIdNumber)) {
    throw new Error(`Invalid exchange id: ${exchangeId}`)
  }
  const filteredUserExchanges = userExchanges.filter(
    userExchange => userExchange.exchange_id === exchangeIdNumber,
  )
  if (filteredUserExchanges.length < 1) {
    throw new Error(`No user exchanges found for exchange id: ${exchangeId}`)
  }
  const balances = await FetchBalancesFromUserExchanges(filteredUserExchanges)
  return balances
}

// this is called by both dashboard and telegram callback
export const FetchBalancesFromUserExchanges = async (
  userExchanges: UserExchangeInfo[],
): Promise<Record<string, Record<string, Balance> | null>> => {
  const response: Record<string, Record<string, Balance> | null> = {}
  for (const userExchange of userExchanges) {
    const key = userExchange.exchange_name.toLowerCase()
    if (!(key in Balances)) continue
    try {
      const balances =
        await Balances[key as keyof typeof Balances](userExchange)
      response[userExchange.exchange_name.toLowerCase()] = balances as Record<
        string,
        Balance
      > | null
    } catch (e) {
      logger.error(e)
    }
  }
  return response
}
