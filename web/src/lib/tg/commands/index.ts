import {GetExchangesByUserId} from '@/lib/exchanges'
import {ExchangeInfo} from '@/types/exchange-info'

export type CommandResponse = {
  text: string
  reply_markup?: {inline_keyboard: {text: string; callback_data: string}[][]}
}

export const HandleCommand = async (
  command: string,
  userId: string,
): Promise<CommandResponse | null> => {
  switch (command) {
    case 'start':
      return StartCommand()
    case 'prices':
      return PricesCommand(userId)
    case 'balances':
      return BalancesCommand(userId)
    default:
      return null
  }
}

export const StartCommand = (): CommandResponse => {
  return {
    text: 'Hello, world!',
  }
}

async function PricesCommand(userId: string): Promise<CommandResponse> {
  const exchanges = await GetExchangesByUserId(userId)
  const buttons: {text: string; callback_data: string}[] = exchanges.map(
    (exchange: ExchangeInfo) => ({
      text: exchange.name,
      callback_data: `prices:${exchange.id}`,
    }),
  )
  buttons.push({text: 'All', callback_data: 'prices:all'})

  return {
    text: 'Select an exchange for PRICES:',
    reply_markup: {
      inline_keyboard: [buttons],
    },
  }
}

async function BalancesCommand(userId: string): Promise<CommandResponse> {
  const exchanges = await GetExchangesByUserId(userId)
  const buttons: {text: string; callback_data: string}[] = exchanges.map(
    (exchange: ExchangeInfo) => ({
      text: exchange.name,
      callback_data: `balances:${exchange.id}`,
    }),
  )
  buttons.push({text: 'All', callback_data: 'balances:all'})

  return {
    text: 'Select an exchange for BALANCES:',
    reply_markup: {
      inline_keyboard: [buttons],
    },
  }
}
