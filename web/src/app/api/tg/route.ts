import { NextRequest, NextResponse } from "next/server"
import { GetTGIDs } from "@/lib/tg"
import { HandleCommand } from "@/lib/tg/commands"
import { HandleCallback } from "@/lib/tg/callbacks"

async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: { inline_keyboard: { text: string; callback_data: string }[][] },
  parseMode?: "Markdown" | "HTML",
  ttl?: number
) {
  const url = `${process.env.TG_API_URL}${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...(replyMarkup && { reply_markup: replyMarkup }),
      ...(parseMode && { parse_mode: parseMode }),
    }),
  })
  const json = await res.json()
  if (ttl) {
    setTimeout(() => {
      try {
        fetch(`${process.env.TG_API_URL}${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, message_id: json.result.message_id }),
        })
      } catch (error) {
        console.error(error)
      }
    }, ttl * 1000)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const fromId = body.message?.from?.id
    const isBot = body.message?.from?.is_bot
    const firstName = body.message?.from?.first_name
    const username = body.message?.from?.username
    const chatId = body.message?.chat?.id
    const text = body.message?.text ?? ""
    const tgIds = await GetTGIDs()
    if (text.startsWith("/") && tgIds.includes(fromId)) {
      const command = text.slice(1).split(/\s/)[0]
      const response = await HandleCommand(command)
      if (response) {
        await sendTelegramMessage(chatId, response.text, response.reply_markup)
      }
      return NextResponse.json({ status: 200 })
    }
    if (typeof body.callback_query !== "undefined" && tgIds.includes(body.callback_query.from.id)) {
      const callbackQuery = body.callback_query
      const data = callbackQuery.data
      const chatId = callbackQuery.message?.chat?.id
      const response = await HandleCallback(data, fromId)
      if (response && chatId != null) {
        await sendTelegramMessage(chatId, response.text, undefined, "Markdown", response.ttl)
      }
      return NextResponse.json({ status: 200 })
    }
    return NextResponse.json({ status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(message)
    return NextResponse.json({ status: 200, error: message }, { status: 200 })
  }
}