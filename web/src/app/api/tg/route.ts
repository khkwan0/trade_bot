import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log(request.text)
  try {
    const body = await request.json()
    const fromId = body.message.from.id
    const isBot = body.message.from.is_bot
    const firstName = body.message.from.first_name
    const username = body.message.from.username
    const chatId = body.message.chat.id
    const text = body.message.text
    return NextResponse.json({status: 200})
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ status: 500, error: message }, { status: 500 })
  }
}