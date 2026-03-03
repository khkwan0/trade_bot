import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const URL = `${process.env.TG_API_URL}${process.env.TELEGRAM_BOT_TOKEN}/setWebhook`
    const res = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: `${process.env.TG_WEBHOOK_URL}`,
        allowed_updates: ["message", "callback_query"],
      }),
    })
    if (!res.ok) {
      throw new Error(`Failed to register webhook: ${res.statusText}`)
    }
    return NextResponse.json({ status: 200 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ status: 500, error: message }, { status: 500 })
  }
}