import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const exchanges = await prisma.exchanges.findMany({
    where: {user_id: session.user.id} as never,
    orderBy: {name: 'asc'},
    select: {
      id: true,
      name: true,
      url: true,
      api_key: true,
      api_secret: true,
      active: true,
      created_at: true,
      updated_at: true,
    },
  })
  return NextResponse.json(
    exchanges.map(({api_key, api_secret, ...rest}) => ({
      ...rest,
      hasApiKey: Boolean(api_key),
      hasApiSecret: Boolean(api_secret),
    })),
  )
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    name?: string
    url?: string | null
    api_key?: string | null
    api_secret?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({error: 'name_required'}, {status: 400})
  }
  const url = typeof body.url === 'string' ? body.url.trim() || null : null
  const apiKey =
    typeof body.api_key === 'string' ? body.api_key.trim() || null : null
  const apiSecret =
    typeof body.api_secret === 'string' ? body.api_secret.trim() || null : null
  try {
    const exchange = await prisma.exchanges.create({
      data: {
        user_id: session.user.id,
        name,
        // Use '' for url when empty so DB works when column is still NOT NULL (migration not applied)
        url: url && url.length > 0 ? url : '',
        api_key: apiKey ?? null,
        api_secret: apiSecret ?? null,
      } as unknown as Parameters<typeof prisma.exchanges.create>[0]['data'],
    })
    return NextResponse.json({
      id: exchange.id,
      name: exchange.name,
      url: exchange.url,
      hasApiKey: Boolean(exchange.api_key),
      hasApiSecret: Boolean(exchange.api_secret),
      active: exchange.active,
      created_at: exchange.created_at,
      updated_at: exchange.updated_at,
    })
  } catch (e: unknown) {
    console.log(e)
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: isUnique ? 'duplicate_name' : 'create_failed',
        ...(process.env.NODE_ENV === 'development' && {details: message}),
      },
      {status: 400},
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  let body: {
    id?: number
    name?: string
    url?: string | null
    api_key?: string | null
    api_secret?: string | null
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
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({error: 'name_required'}, {status: 400})
  }
  const url = typeof body.url === 'string' ? body.url.trim() || null : undefined
  const apiKey =
    typeof body.api_key === 'string' ? body.api_key.trim() : undefined
  const apiSecret =
    typeof body.api_secret === 'string' ? body.api_secret.trim() : undefined

  const existing = await prisma.exchanges.findFirst({
    where: {id, user_id: session.user.id} as never,
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  const data = {
    name,
    ...(url !== undefined && {url: url || null}),
    ...(apiKey !== undefined && {api_key: apiKey || null}),
    ...(apiSecret !== undefined && {api_secret: apiSecret || null}),
    updated_at: new Date(),
  } as unknown as Parameters<typeof prisma.exchanges.update>[0]['data']

  try {
    const exchange = await prisma.exchanges.update({
      where: {id},
      data,
    })
    return NextResponse.json({
      id: exchange.id,
      name: exchange.name,
      url: exchange.url,
      hasApiKey: Boolean(exchange.api_key),
      hasApiSecret: Boolean(exchange.api_secret),
      active: exchange.active,
      created_at: exchange.created_at,
      updated_at: exchange.updated_at,
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_name' : 'update_failed'},
      {status: 400},
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

  const existing = await prisma.exchanges.findFirst({
    where: {id, user_id: session.user.id} as never,
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  await prisma.exchanges.delete({where: {id}})
  return NextResponse.json({ok: true})
}
