import {prisma} from '@/lib/prisma'
import {logger} from '@/lib/logger'

export type ExchangeInfo = {
  id: number
  name: string
  url: string
  apiKey?: string
  apiSecret?: string
}

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
    const url = FormUrlForExchangePriceURL(exchange.name, pairs)
    if (!url) {
      throw new Error(`URL not found for exchange: ${exchange.name}`)
    }
    logger.info('Fetching prices from exchange: ' + url)
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    })
    const prices = await res.json()
    const normalizedPriceFormat = NormalizePriceFormat(
      exchange.name,
      pairs,
      prices,
    )
    logger.info(
      'Normalized price format: ' + JSON.stringify(normalizedPriceFormat),
    )
    response[exchange.name] = normalizedPriceFormat
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

export const FormUrlForExchangePriceURL = (
  name: string,
  pairs: string[] = [],
): string => {
  let finalUrl: string | null = null
  if (name.toLowerCase() === 'bitkub') {
    finalUrl = 'https://api.bitkub.com/api/v3/market/ticker'
  }
  if (name.toLowerCase() === 'kraken') {
    const krakenPairs = pairs.map(pair => pair.replace('_', '').toUpperCase())
    const krakenPairsString = krakenPairs.join(',')
    finalUrl = `https://api.kraken.com/0/public/Ticker?pair=${krakenPairsString}`
  }
  if (name.toLowerCase() === 'jupiter') {
    const pairMappings = GetPairMappingsForExchange(name, pairs)
    finalUrl =
      'https://api.jupiter.com/v1/prices?symbols=' + pairMappings.join(',')
  }
  return finalUrl ?? ''
}

export const NormalizePriceFormat = (
  exchangeName: string,
  pairs: string[],
  prices: any,
) => {
  const response: Record<string, number> = {}
  if (exchangeName.toLowerCase() === 'kraken') {
    const krakenPairs = Object.keys(prices.result)
    const legacyPairs = ['BTC_USD', 'ETH_USD']
    const ourPairs = pairs.map(pair => {
      if (legacyPairs.includes(pair)) {
        if (pair === 'BTC_USD') {
          return {
            originalPair: pair,
            newPair: 'XXBTZUSD',
          }
        } else {
          return {
            originalPair: pair,
            newPair: 'X' + pair.replace('_', 'Z').toUpperCase(),
          }
        }
      } else {
        return {
          originalPair: pair,
          newPair: pair.replace('_', '').toUpperCase(),
        }
      }
    })
    krakenPairs.forEach(pair => {
      if (pair) {
        const ourPair = ourPairs.find(p => p.newPair === pair)
        if (ourPair) {
          response[ourPair.originalPair] = prices.result[pair].c[0]
        }
      }
    })
    return response
  }
  if (exchangeName.toLowerCase() === 'bitkub') {
    // filter out our pairs from the prices
    for (const pair of pairs) {
      const price = prices.find(
        (p: {symbol: string; last: number}) => p.symbol === pair,
      )
      if (!price) continue
      response[pair] = price.last
    }
    if (typeof response['USDC_THB'] !== 'undefined') {
      const conversion: Record<string, number> = {}
      Object.keys(response).forEach(pair => {
        const [base, quote] = pair.split('_')
        if (base !== 'USDC') {
          conversion[base + '_USDC'] = response[pair] / response['USDC_THB']
        }
      })
      return {
        ...response,
        ...conversion,
      }
    }
  }
  return null
}

export const GetPairMappingsForExchange = (
  exchangeName: string,
  pairs: string[],
) => {
  if (exchangeName.toLowerCase() === 'jupiter') {
    return pairs.map(pair => pair.replace('_', '').toUpperCase())
  }
  return pairs
}
