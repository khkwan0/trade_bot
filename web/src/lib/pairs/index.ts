import {prisma} from '@/lib/prisma'

export const GetPairsByExchangeId = async (exchangeId: string) => {
  const rows = await prisma.pairs.findMany({
    where: {exchange_id: Number(exchangeId), active: true},
    select: {base_currency: true, quote_currency: true},
  })
  return rows.map(row => `${row.base_currency}_${row.quote_currency}`)
}
