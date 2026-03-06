import {logger} from '@/lib/logger'

export default async function (
  exchangeName: string,
  pairs: string[],
): Promise<Record<string, number>> {
  logger.info('Fetching prices for exchange: ' + exchangeName)
  const priceEndPoint = PriceEndPoints[exchangeName.toLowerCase()](pairs)
  const res = await fetch(priceEndPoint, {
    headers: {
      Accept: 'application/json',
    },
  })
  const data = await res.json()
  const normalized = NormalizePricesMap[
    exchangeName.toLowerCase() as keyof typeof NormalizePricesMap
  ](data, pairs)
  return normalized
}

const PriceEndPoints: Record<string, (pairs: string[]) => string> = {
  bitkub: function (): string {
    return 'https://api.bitkub.com/api/v3/market/ticker'
  },
  kraken: function (pairs: string[]): string {
    const krakenPairs = pairs.map(pair => pair.replace('_', '').toUpperCase())
    const krakenPairsString = krakenPairs.join(',')
    return `https://api.kraken.com/0/public/Ticker?pair=${krakenPairsString}`
  },
  jupiter: function (pairs: string[]): string {
    const pairMappings = GetPairMappingsForExchange('jupiter', pairs)
    const finalUrl =
      'https://api.jupiter.com/v1/prices?symbols=' + pairMappings.join(',')
    return finalUrl
  },
  binance: function (): string {
    return 'https://api.binance.com/api/v3/ticker/price'
  },
}

const NormalizePricesMap = {
  bitkub: function (prices: any, pairs: string[]): Record<string, number> {
    const response: Record<string, number> = {}
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
      Object.assign(response, conversion)
    }
    return response
  },
  kraken: function (prices: any, pairs: string[]): Record<string, number> {
    const response: Record<string, number> = {}
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
  },
  jupiter: function (prices: any): Record<string, number> {
    return prices
  },
  binance: function (prices: any, pairs: string[]): Record<string, number> {
    const response: Record<string, number> = {}
    for (const pair of pairs) {
      const price = prices.find(
        (p: {symbol: string; price: number}) =>
          p.symbol === pair.replace('_', '').toUpperCase(),
      )
      if (!price) continue
      response[pair] = price.price
    }
    return response
  },
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
