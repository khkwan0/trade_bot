import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {getSymbols} from '@/lib/exchanges/symbols'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const url = new URL(request.url)
  const exchange = url.searchParams.get('exchange')
  if (!exchange) {
    return NextResponse.json({error: 'exchange required'}, {status: 400})
  }

  try {
    const result = await getSymbols(exchange)
    return NextResponse.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to fetch symbols'
    const status =
      message === 'Unknown exchange' ? 400 : 502
    return NextResponse.json({error: message}, {status})
  }
}
