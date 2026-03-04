import {NextRequest, NextResponse} from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(
      `${process.env.TG_API_URL}${process.env.TELEGRAM_BOT_TOKEN}/getWebhookInfo`,
    )
    if (!res.ok) {
      throw new Error(`Failed to get webhook info: ${res.statusText}`)
    }
    const data = await res.json()
    return NextResponse.json({status: 200})
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({status: 500, error: message}, {status: 500})
  }
}
