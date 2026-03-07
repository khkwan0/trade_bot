import {UserExchangeInfo} from '@/types/exchange-info'
import ApiSignatures from '@/lib/exchanges/api-signatures'

export const ExecuteTrade = {
  bitkub: async function (
    action: 'buy' | 'sell',
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const url = `${userExchange.exchange_url}/api/v3/market/trades?symbol=${market}&amount=${amount}`
    const headers = await ApiSignatures.bitkub(
      userExchange.api_key,
      userExchange.api_secret,
      'POST',
      '/api/v3/market/trades',
      JSON.stringify({symbol: market, amount: amount}),
      url,
    )
    const res = await fetch(url, {headers})
    const data = await res.json()
    return data
  },
  binance: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const url = `${userExchange.exchange_url}/api/v3/trades?symbol=${market}&amount=${amount}`
    const headers = await ApiSignatures.binance(
      userExchange.api_key,
      userExchange.api_secret,
      '/api/v3/trades',
      JSON.stringify({symbol: market, amount: amount}),
    )
    const res = await fetch(url, {headers})
    const data = await res.json()
    return data
  },
  kraken: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const url = `${userExchange.exchange_url}/0/public/Trades?symbol=${market}&amount=${amount}`
    const headers = await ApiSignatures.kraken(
      userExchange.api_key,
      userExchange.api_secret,
      '/0/public/Trades',
      {symbol: market, amount: amount},
    )
    const res = await fetch(url, {headers})
    const data = await res.json()
    return data
  },
  jupiter: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    if (!userExchange.api_key || !userExchange.api_secret) {
      return []
    }
    const url = `${userExchange.exchange_url}/v1/trades?symbol=${market}&amount=${amount}`
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userExchange.api_key}`,
    }
    const res = await fetch(url, {headers})
    const data = await res.json()
    return data
  },
}

export const GetTrades = {
  bitkub: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const trades = await ExecuteTrade.bitkub(userExchange, market, amount)
    return trades
  },
  binance: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const trades = await ExecuteTrade.binance(userExchange, market, amount)
    return trades
  },
  kraken: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const trades = await ExecuteTrade.kraken(userExchange, market, amount)
    return trades
  },
  jupiter: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const trades = await ExecuteTrade.jupiter(userExchange, market, amount)
    return trades
  },
}

export const GetOrders = {
  bitkub: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const orders = await ExecuteOrder.bitkub(userExchange, market, amount)
    return orderBook
  },
  binance: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const trades = await ExecuteTrade.binance(userExchange, market, amount)
    return orderBook
  },
  kraken: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const orderBook = await ExecuteOrderBook.kraken(
      userExchange,
      market,
      amount,
    )
    return orderBook
  },
  jupiter: async function (
    userExchange: UserExchangeInfo,
    market: string,
    amount: number,
  ) {
    const orderBook = await ExecuteOrderBook.jupiter(
      userExchange,
      market,
      amount,
    )
    return orderBook
  },
}
