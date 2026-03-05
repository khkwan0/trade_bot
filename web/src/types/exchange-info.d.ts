export type ExchangeInfo = {
  id: number
  name: string
  url: string
  apiKey?: string
  apiSecret?: string
}

export type Balance = { available: number; reserved: number }
