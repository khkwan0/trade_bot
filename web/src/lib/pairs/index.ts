import { db } from "@/lib/db"

export const GetPairsByExchangeId = async (exchangeId: string) => {
  const res = await db`SELECT id, base_currency, quote_currency FROM pairs WHERE exchange_id = ${exchangeId} AND active = TRUE`
  const pairs = res.map((row: { id: number; base_currency: string; quote_currency: string }) => `${row.base_currency}_${row.quote_currency}`)
  return pairs
}