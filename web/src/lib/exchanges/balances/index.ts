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
  kraken: function (
    rawBalances: Record<string, string>,
  ): Record<string, {available: number; reserved: number}> {
    const normalized: Record<string, {available: number; reserved: number}> = {}
    for (const [asset, balanceStr] of Object.entries(rawBalances)) {
      const available = parseFloat(balanceStr)
      if (Number.isNaN(available) || available <= 0) continue
      normalized[asset] = { available, reserved: 0 }
    }
    return normalized
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
  kraken: async function (exchange: ExchangeInfo) {
    if (!exchange.apiKey || !exchange.apiSecret) {
      throw new Error('Kraken API key and secret required')
    }
    const path = '/0/private/Balance'
    const url = `https://api.kraken.com${path}`
    const sig = await ApiSignatures.kraken(
      exchange.apiKey,
      exchange.apiSecret,
      path,
    )
    const { body, ...headers } = sig
    const res = await fetch(url, { method: 'POST', headers, body })
    const data = await res.json()
    if (data.error?.length) {
      throw new Error('Kraken API error: ' + (data.error as string[]).join(', '))
    }
    const raw = (data.result ?? {}) as Record<string, string>
    return NormalizeBalancesMap.kraken(raw)
  },
}
