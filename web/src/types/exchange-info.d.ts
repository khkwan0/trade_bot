export type UserExchangeInfo = {
  id: number
  user_id: string
  exchange_id: number
  exchange_name: string
  exchange_url: string | null
  api_key: string | null
  api_secret: string | null
  active: boolean
  created_at: Date
  updated_at: Date
}

export type ExchangeInfo = {
  id: number
  name: string
  url: string | null
  active: boolean
  created_at: Date
  updated_at: Date
}

export type Balance = {available: number; reserved: number}
