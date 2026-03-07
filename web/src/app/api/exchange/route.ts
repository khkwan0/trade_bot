import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

/** List current user's exchange connections (user_exchanges) with exchange name. */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const rows = await prisma.user_exchanges.findMany({
    where: {user_id: session.user.id},
    orderBy: {exchange: {name: 'asc'}},
    include: {
      exchange: {select: {id: true, name: true, url: true}},
    },
  })
  return NextResponse.json(
    rows.map(({api_key, api_secret, exchange, ...rest}) => ({
      ...rest,
      exchange_id: exchange.id,
      name: exchange.name,
      url: exchange.url ?? null,
      hasApiKey: Boolean(api_key),
      hasApiSecret: Boolean(api_secret),
    })),
  )
}

/** Create a user_exchange: link user to an exchange and optionally set API key/secret. */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    exchange_id?: number
    api_key?: string | null
    api_secret?: string | null
    maker_fee?: number
    taker_fee?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const exchangeId =
    typeof body.exchange_id === 'number'
      ? body.exchange_id
      : typeof body.exchange_id === 'string'
        ? parseInt(body.exchange_id, 10)
        : NaN
  if (!Number.isInteger(exchangeId)) {
    return NextResponse.json({error: 'exchange_id_required'}, {status: 400})
  }
  const apiKey =
    typeof body.api_key === 'string' ? body.api_key.trim() || null : null
  const apiSecret =
    typeof body.api_secret === 'string' ? body.api_secret.trim() || null : null
  const makerFee =
    typeof body.maker_fee === 'number' && Number.isFinite(body.maker_fee)
      ? Math.max(0, Math.min(1, body.maker_fee))
      : 0
  const takerFee =
    typeof body.taker_fee === 'number' && Number.isFinite(body.taker_fee)
      ? Math.max(0, Math.min(1, body.taker_fee))
      : 0

  const exchange = await prisma.exchanges.findFirst({
    where: {id: exchangeId, active: true},
  })
  if (!exchange) {
    return NextResponse.json({error: 'exchange_not_found'}, {status: 404})
  }

  try {
    const userExchange = await prisma.user_exchanges.create({
      data: {
        user_id: session.user.id,
        exchange_id: exchangeId,
        api_key: apiKey,
        api_secret: apiSecret,
        maker_fee: makerFee,
        taker_fee: takerFee,
      },
      include: {
        exchange: {select: {id: true, name: true, url: true}},
      },
    })
    const {api_key, api_secret, exchange: ex} = userExchange
    return NextResponse.json({
      id: userExchange.id,
      exchange_id: ex.id,
      name: ex.name,
      url: ex.url ?? null,
      hasApiKey: Boolean(api_key),
      hasApiSecret: Boolean(api_secret),
      maker_fee: userExchange.maker_fee,
      taker_fee: userExchange.taker_fee,
      active: userExchange.active,
      created_at: userExchange.created_at,
      updated_at: userExchange.updated_at,
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {
        error: isUnique ? 'already_connected' : 'create_failed',
        ...(process.env.NODE_ENV === 'development' &&
          e instanceof Error && {details: e.message}),
      },
      {status: 400},
    )
  }
}

/** Update a user_exchange (API key/secret only). */
export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    id?: number
    api_key?: string | null
    api_secret?: string | null
    maker_fee?: number
    taker_fee?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const id =
    typeof body.id === 'number'
      ? body.id
      : typeof body.id === 'string'
        ? parseInt(body.id, 10)
        : NaN
  if (!Number.isInteger(id)) {
    return NextResponse.json({error: 'Invalid id'}, {status: 400})
  }
  const apiKey =
    typeof body.api_key === 'string' ? body.api_key.trim() : undefined
  const apiSecret =
    typeof body.api_secret === 'string' ? body.api_secret.trim() : undefined
  const makerFee =
    typeof body.maker_fee === 'number' && Number.isFinite(body.maker_fee)
      ? Math.max(0, Math.min(1, body.maker_fee))
      : undefined
  const takerFee =
    typeof body.taker_fee === 'number' && Number.isFinite(body.taker_fee)
      ? Math.max(0, Math.min(1, body.taker_fee))
      : undefined

  const existing = await prisma.user_exchanges.findFirst({
    where: {id, user_id: session.user.id},
    include: {exchange: {select: {id: true, name: true, url: true}}},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  const data: {
    api_key?: string | null
    api_secret?: string | null
    maker_fee?: number
    taker_fee?: number
    updated_at: Date
  } = {updated_at: new Date()}
  if (apiKey !== undefined) data.api_key = apiKey || null
  if (apiSecret !== undefined) data.api_secret = apiSecret || null
  if (makerFee !== undefined) data.maker_fee = makerFee
  if (takerFee !== undefined) data.taker_fee = takerFee

  const updated = await prisma.user_exchanges.update({
    where: {id},
    data,
    include: {exchange: {select: {id: true, name: true, url: true}}},
  })
  const {api_key, api_secret, exchange: ex} = updated
  return NextResponse.json({
    id: updated.id,
    exchange_id: ex.id,
    name: ex.name,
    url: ex.url ?? null,
    hasApiKey: Boolean(api_key),
    hasApiSecret: Boolean(api_secret),
    maker_fee: updated.maker_fee,
    taker_fee: updated.taker_fee,
    active: updated.active,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  })
}

/** Delete a user_exchange. */
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let id: number
  const url = new URL(request.url)
  const idParam = url.searchParams.get('id')
  if (idParam != null) {
    id = parseInt(idParam, 10)
  } else {
    try {
      const body = await request.json()
      id =
        typeof body.id === 'number'
          ? body.id
          : typeof body.id === 'string'
            ? parseInt(body.id, 10)
            : NaN
    } catch {
      return NextResponse.json({error: 'Invalid request'}, {status: 400})
    }
  }
  if (!Number.isInteger(id)) {
    return NextResponse.json({error: 'Invalid id'}, {status: 400})
  }

  const existing = await prisma.user_exchanges.findFirst({
    where: {id, user_id: session.user.id},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  await prisma.user_exchanges.delete({where: {id}})
  return NextResponse.json({ok: true})
}
