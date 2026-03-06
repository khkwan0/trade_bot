import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const url = new URL(request.url)
  const ueIdParam = url.searchParams.get('user_exchange_id') ?? url.searchParams.get('exchange_id')
  const userExchangeId = ueIdParam != null ? parseInt(ueIdParam, 10) : NaN
  if (!Number.isInteger(userExchangeId)) {
    return NextResponse.json({error: 'user_exchange_id required'}, {status: 400})
  }

  const userExchange = await prisma.user_exchanges.findFirst({
    where: {id: userExchangeId, user_id: session.user.id},
  })
  if (!userExchange) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  const pairs = await prisma.pairs.findMany({
    where: {user_exchange_id: userExchangeId, user_id: session.user.id},
    orderBy: [{base_currency: 'asc'}, {quote_currency: 'asc'}],
    select: {
      id: true,
      user_exchange_id: true,
      base_currency: true,
      quote_currency: true,
      active: true,
      created_at: true,
      updated_at: true,
    },
  })
  return NextResponse.json(
    pairs.map(p => ({
      ...p,
      exchange_id: p.user_exchange_id,
    })),
  )
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    user_exchange_id?: number
    exchange_id?: number
    base_currency?: string
    quote_currency?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }

  const userExchangeId =
    typeof body.user_exchange_id === 'number'
      ? body.user_exchange_id
      : typeof body.exchange_id === 'number'
        ? body.exchange_id
        : typeof body.user_exchange_id === 'string'
          ? parseInt(body.user_exchange_id, 10)
          : typeof body.exchange_id === 'string'
            ? parseInt(body.exchange_id, 10)
            : NaN
  if (!Number.isInteger(userExchangeId)) {
    return NextResponse.json({error: 'user_exchange_id required'}, {status: 400})
  }

  const base =
    typeof body.base_currency === 'string'
      ? body.base_currency.trim().toUpperCase()
      : ''
  const quote =
    typeof body.quote_currency === 'string'
      ? body.quote_currency.trim().toUpperCase()
      : ''
  if (!base || !quote) {
    return NextResponse.json(
      {error: 'base_currency and quote_currency required'},
      {status: 400}
    )
  }

  const userExchange = await prisma.user_exchanges.findFirst({
    where: {id: userExchangeId, user_id: session.user.id},
  })
  if (!userExchange) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  try {
    const pair = await prisma.pairs.create({
      data: {
        user_id: session.user.id,
        user_exchange_id: userExchangeId,
        base_currency: base,
        quote_currency: quote,
      },
    })
    return NextResponse.json({
      id: pair.id,
      exchange_id: pair.user_exchange_id,
      user_exchange_id: pair.user_exchange_id,
      base_currency: pair.base_currency,
      quote_currency: pair.quote_currency,
      active: pair.active,
      created_at: pair.created_at,
      updated_at: pair.updated_at,
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_pair' : 'create_failed'},
      {status: 400}
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    id?: number
    base_currency?: string
    quote_currency?: string
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

  const base =
    typeof body.base_currency === 'string'
      ? body.base_currency.trim().toUpperCase()
      : ''
  const quote =
    typeof body.quote_currency === 'string'
      ? body.quote_currency.trim().toUpperCase()
      : ''
  if (!base || !quote) {
    return NextResponse.json(
      {error: 'base_currency and quote_currency required'},
      {status: 400}
    )
  }

  const existing = await prisma.pairs.findFirst({
    where: {id, user_id: session.user.id},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  try {
    const pair = await prisma.pairs.update({
      where: {id},
      data: {
        base_currency: base,
        quote_currency: quote,
        updated_at: new Date(),
      },
    })
    return NextResponse.json({
      id: pair.id,
      exchange_id: pair.user_exchange_id,
      user_exchange_id: pair.user_exchange_id,
      base_currency: pair.base_currency,
      quote_currency: pair.quote_currency,
      active: pair.active,
      created_at: pair.created_at,
      updated_at: pair.updated_at,
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_pair' : 'update_failed'},
      {status: 400}
    )
  }
}

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

  const existing = await prisma.pairs.findFirst({
    where: {id, user_id: session.user.id},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  await prisma.pairs.delete({where: {id}})
  return NextResponse.json({ok: true})
}
