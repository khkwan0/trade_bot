import { prisma } from "@/lib/prisma"

export type CommandResponse = {
  text: string
  reply_markup?: { inline_keyboard: { text: string; callback_data: string }[][] }
}

export const HandleCommand = async (command: string): Promise<CommandResponse | null> => {
  switch (command) {
    case "start":
      return StartCommand()
    case "prices":
      return PricesCommand()
    default:
      return null
  }
}

export const StartCommand = (): CommandResponse => {
  return {
    text: "Hello, world!",
  }
}

async function PricesCommand(): Promise<CommandResponse> {
  const rows = await prisma.exchanges.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  })
  const buttons: { text: string; callback_data: string }[] = rows.map((row) => ({
    text: row.name,
    callback_data: `prices:${row.id}`,
  }))
  buttons.push({ text: "All", callback_data: "prices:all" })

  return {
    text: "Select an exchange:",
    reply_markup: {
      inline_keyboard: [buttons],
    },
  }
}