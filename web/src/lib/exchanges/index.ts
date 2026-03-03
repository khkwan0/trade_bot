import { db } from "@/lib/db"

export type ExchangeInfo = {
  id: number
  name: string
  url: string
  apiKey?: string
  apiSecret?: string
}

export const GetExchangeInfo = async (exchangeId: string): Promise<ExchangeInfo[] | null> => {
  if (exchangeId === "all") {
    const exchanges = await db`SELECT * FROM exchanges`
    return exchanges
  } else {
    const exchangeInfo = await db`SELECT * FROM exchanges WHERE id = ${exchangeId}`
    return exchangeInfo
  }
}

export const GetPricesFromExchange = async (exchangeId: string, pairs: string[]) => {
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
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    })
    const prices = await res.json()
    const normalizedPriceFormat = NormalizePriceFormat(exchange.name, pairs, prices)
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

export const FormUrlForExchangePriceURL = (name: string, pairs: string[] = []): string => {
  let finalUrl: string | null = null
  if (name.toLowerCase() === 'bitkub') {
    finalUrl = 'https://api.bitkub.com/api/v3/market/ticker'
  }
  if (name.toLowerCase() === 'kraken') {
    const krakenPairs = pairs.map((pair) => pair.replace('_', '').toUpperCase())
    const krakenPairsString = krakenPairs.join(',')
    finalUrl = `https://api.kraken.com/0/public/Ticker?pair=${krakenPairsString}`
  }
  return finalUrl ?? ''
}

export const NormalizePriceFormat = (exchangeName: string, pairs: string[], prices: any) => {
  const response: Record<string, number> = {}
  if (exchangeName.toLowerCase() === 'kraken') {
    const krakenPairs = Object.keys(prices.result)
    const legacyPairs = ["btc_usd", "eth_usd"]
    const ourPairs = pairs.map(pair => {
      if (legacyPairs.includes(pair)) {
        if (pair === 'btc_usd') {
          return {
            originalPair: pair,
            newPair: 'XXBTZUSD'
          }
        } else {
          return {
            originalPair: pair,
            newPair: 'X' + pair.replace('_', 'Z').toUpperCase()
          }
        }
      } else {
        return {
          originalPair: pair,
          newPair: pair.replace('_', '').toUpperCase()
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
      const price = prices.find((p: { symbol: string; last: number }) => p.symbol.toLowerCase() === pair.toLowerCase())
      if (!price) continue
      response[pair] = price.last
    }
    if (typeof response['usdc_thb'] !== 'undefined') {
      const conversion: Record<string, number> = {}
      Object.keys(response).forEach(pair => {
        const [base, quote] = pair.split('_')
        if (base !== 'usdc') {
          conversion[base + '_usdc'] = response[pair] / response['usdc_thb']
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