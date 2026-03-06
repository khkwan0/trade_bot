import {prisma} from '@/lib/prisma'

export const GetPairsByUserIdAndExchangeId = async (
  userId: string,
  exchangeId: string,
) => {
  // get the user_exchaneid assocaiged with userid and exchange_id
  const userExchange = await prisma.user_exchanges.findFirst({
    where: {user_id: userId, exchange_id: Number(exchangeId)},
    select: {id: true},
  })

  if (!userExchange) {
    return []
  }
  // get the pairs associated with the user_exchange
  const pairs = await prisma.pairs.findMany({
    where: {user_exchange_id: userExchange.id},
    select: {base_currency: true, quote_currency: true},
  })

  if (!pairs) {
    return []
  }
  return pairs.map(pair => `${pair.base_currency}_${pair.quote_currency}`)
}
