import { GetPricesFromExchange } from "@/lib/exchanges"

export const GetPrices = async (
  exchangeId: string,
  pairs: string[]
): Promise<Record<string, Record<string, number>>> => {
  const raw = await GetPricesFromExchange(exchangeId, pairs)
  const result: Record<string, Record<string, number>> = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v != null) result[k] = v
  }
  return result
}