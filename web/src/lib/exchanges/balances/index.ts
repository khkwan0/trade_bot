import ApiSignatures from '@/lib/exchanges/api-signatures'
import {ExchangeInfo} from '@/types/exchange-info'

type BalanceAmounts = { available?: number; reserved?: number }

const NormalizeBalancesMap = {
  bitkub: function (rawBalances: Record<string, unknown>) {
    const normalizedBalances: Record<
      string,
      {available: number; reserved: number}
    > = {}
    for (const [token, amounts] of Object.entries(rawBalances)) {
      const a = amounts as BalanceAmounts
      if ((a.available ?? 0) > 0 || (a.reserved ?? 0) > 0) {
        normalizedBalances[token] = {
          available: a.available ?? 0,
          reserved: a.reserved ?? 0,
        }
      }
    }
    return normalizedBalances
  },
  kraken: function (rawBalances: Record<string, unknown>) {
    return rawBalances
  },
}

export default {
  bitkub: async function (exchange: ExchangeInfo) {
    if (!exchange.apiKey || !exchange.apiSecret) {
      throw 'Bitkub API key and secret required'
    }
    const BITKUB_API_BASE = 'https://api.bitkub.com'
    const path = '/api/v3/market/balances'
    const url = `${BITKUB_API_BASE}${path}`
    const headers = await ApiSignatures.bitkub(
      exchange.apiKey,
      exchange.apiSecret,
      'POST',
      path,
    )
    const res = await fetch(url, {method: 'POST', headers})
    const data = await res.json()
    if (data.error) {
      throw new Error('Bitkub API error: ' + data.error)
    }
    const normalized = NormalizeBalancesMap.bitkub(data.result)
    return normalized
  },
  kraken: function (rawBalances: Record<string, unknown>) {
    // todo
    return null
  },
}
