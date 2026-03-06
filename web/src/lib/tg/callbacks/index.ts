import {GetPrices} from '@/lib/prices'
import {GetPairsByUserIdAndExchangeId} from '@/lib/pairs'
import {GetUserIdByTGID} from '@/lib/tg'
import {GetBalancesFromExchange} from '@/lib/exchanges'
import {GetTTL} from '@/lib/ttl'
import {logger} from '@/lib/logger'
import type {Balance} from '@/types/exchange-info'

function formatPricesTwoColumn(
  pricesByExchange: Record<string, Record<string, number>>,
): string {
  const PAIR_COL_WIDTH = 12
  const PRICE_COL_WIDTH = 14
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

function formatBalancesTwoColumn(
  balancesByExchange: Record<string, Record<string, Balance>>,
): string {
  const TOKEN_COLUMN_WIDTH = 12
  const AVAILABLE_COLUMN_WIDTH = 14
  const RESERVED_COLUMN_WIDTH = 14
  const lines: string[] = []
  for (const [exchange, balances] of Object.entries(balancesByExchange)) {
    lines.push(
      `\n${exchange.toUpperCase().padEnd(TOKEN_COLUMN_WIDTH)}${'Available'.padEnd(AVAILABLE_COLUMN_WIDTH)}${'Reserved'.padEnd(RESERVED_COLUMN_WIDTH)}`,
    )
    lines.push(
      '─'.repeat(
        TOKEN_COLUMN_WIDTH + AVAILABLE_COLUMN_WIDTH + RESERVED_COLUMN_WIDTH,
      ),
    )
    for (const [token, balance] of Object.entries(balances)) {
      const availableStr = balance.available.toLocaleString('en-US', {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      })
      const reservedStr = balance.reserved.toLocaleString('en-US', {
        minimumFractionDigits: 5,
        maximumFractionDigits: 5,
      })
      lines.push(
        `${token.toUpperCase().padEnd(TOKEN_COLUMN_WIDTH)} ${availableStr.padEnd(AVAILABLE_COLUMN_WIDTH)} ${reservedStr.padEnd(RESERVED_COLUMN_WIDTH)}`,
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
    const userId = await GetUserIdByTGID(tgId)
    if (!userId) {
      return null
    }
    const prices = await PricesCallback(exchangeId, userId)
    const text = formatPricesTwoColumn(prices)
    const ttl = await GetTTL(tgId)
    return text ? {text, ttl: ttl} : null
  }
  if (command === 'balances') {
    const userId = await GetUserIdByTGID(tgId)
    if (!userId) {
      return null
    }
    const balances = await BalancesCallback(exchangeId, userId)
    const balancesNoNull: Record<string, Record<string, Balance>> = {}
    for (const [exchange, b] of Object.entries(balances)) {
      if (b !== null) balancesNoNull[exchange] = b
    }
    const text = formatBalancesTwoColumn(balancesNoNull)
    const ttl = await GetTTL(tgId)
    return text ? {text, ttl: ttl} : null
  }
  return null
}

async function PricesCallback(exchangeId: string, userId: string) {
  const pairs = await GetPairsByUserIdAndExchangeId(userId, exchangeId)
  logger.info('Getting prices for exchange ID: ' + exchangeId)
  logger.info('Pairs: ' + pairs.join(', '))
  return GetPrices(exchangeId, pairs)
}

async function BalancesCallback(exchangeId: string, userId: string) {
  return GetBalancesFromExchange(exchangeId, userId)
}
