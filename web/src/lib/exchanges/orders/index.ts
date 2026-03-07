import ApiSignatures from '@/lib/exchanges/api-signatures'
import {UserExchangeInfo} from '@/types/exchange-info'
import Balances from '@/lib/exchanges/balances'

// open orders exchange implementation
export default {
  bitkub: async function (userExchange: UserExchangeInfo) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    // Bitkkub doesn't have an endpoint that can show all open
    // orders, so the workaround is to get all balances
    // if the balances has a reserved amount that is greater than 0,
    // then the order is open for that symbol.
    const balances = await Balances.bitkub(userExchange)
    const symbols: string[] = []
    if (!Array.isArray(balances)) {
      Object.keys(balances).forEach(symbol => {
        if (balances[symbol].reserved === 0) {
          symbols.push(`${symbol.toUpperCase()}_THB`)
        }
      })
    }
    const data = await Promise.all(
      symbols.map(async symbol => {
        const path = `/api/v3/market/my-open-orders?sym=${symbol}`
        const url = `${userExchange.exchange_url}${path}`
        const headers = await ApiSignatures.bitkub(
          userExchange.api_key ?? '',
          userExchange.api_secret ?? '',
          'GET',
          path,
        )
        const res = await fetch(url, {method: 'GET', headers})
        const orders = await res.json()
        if (orders.error !== 0) return []
        return Array.isArray(orders.result) ? orders.result : []
      }),
    )
    return data.flat()
  },
  kraken: async function (userExchange: UserExchangeInfo) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const path = '/0/private/OpenOrders'
    const url = `${userExchange.exchange_url}${path}`
    const sig = await ApiSignatures.kraken(
      userExchange.api_key,
      userExchange.api_secret,
      path,
    )
    const {body, ...headers} = sig
    const res = await fetch(url, {method: 'POST', headers, body})
    const data = await res.json()
    if (data.error?.length) return []
    return data.result ?? []
  },
  jupiter: async function (userExchange: UserExchangeInfo) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const path = '/v1/orders'
    const url = `${userExchange.exchange_url}${path}`
    const headers = await ApiSignatures.jupiter(
      userExchange.api_key,
      userExchange.api_secret,
      path,
    )
    const res = await fetch(url, {method: 'POST', headers})
    const data = await res.json()
    return data
  },
}
