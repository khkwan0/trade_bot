import {GetPrices} from '@/lib/prices'
import {GetPairsByExchangeId} from '@/lib/pairs'
import {GetTTL} from '@/lib/ttl'
import {logger} from '@/lib/logger'

const PAIR_COL_WIDTH = 12
const PRICE_COL_WIDTH = 14

function formatPricesTwoColumn(
  pricesByExchange: Record<string, Record<string, number>>,
): string {
  const lines: string[] = []
  for (const [exchange, pairs] of Object.entries(pricesByExchange)) {
    lines.push(`\n${exchange}`)
    lines.push('─'.repeat(PAIR_COL_WIDTH + PRICE_COL_WIDTH))
    for (const [pair, price] of Object.entries(pairs)) {
      const pairLabel = pair.replace('_', '/').toUpperCase()
      const priceStr = price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      lines.push(
        `${pairLabel.padEnd(PAIR_COL_WIDTH)}${priceStr.padStart(PRICE_COL_WIDTH)}`,
      )
    }
  }
  return '```\n' + lines.join('\n').trimStart() + '\n```'
}

export const HandleCallback = async (
  data: string,
  tgId: number,
): Promise<{text: string; ttl: number | undefined} | null> => {
  logger.info('Handling callback query from ID: ' + tgId + ' data: ' + data)
  const [command, exchangeId] = data.split(':')
  if (command === 'prices') {
    const prices = await PricesCallback(exchangeId)
    const text = formatPricesTwoColumn(prices)
    const ttl = await GetTTL(tgId)
    return text ? {text, ttl: ttl} : null
  }
  return null
}

async function PricesCallback(exchangeId: string) {
  const pairs = await GetPairsByExchangeId(exchangeId)
  logger.info('Getting prices for exchange ID: ' + exchangeId)
  logger.info('Pairs: ' + pairs.join(', '))
  return GetPrices(exchangeId, pairs)
}
