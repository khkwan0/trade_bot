import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return {error: unauthorized(), user: null}
  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {isAdmin: true},
  })
  if (!user?.isAdmin) return {error: unauthorized(), user: null}
  return {error: null, user: session.user}
}

function toJson(row: {
  id: number
  name: string
  url: string | null
  active: boolean
  created_at: Date
  updated_at: Date
}) {
  return {
    id: row.id,
    name: row.name,
    url: row.url ?? null,
    active: row.active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function GET() {
  const {error} = await requireAdmin()
  if (error) return error

  const rows = await prisma.exchanges.findMany({
    orderBy: {name: 'asc'},
  })
  return NextResponse.json(rows.map(toJson))
}

export async function POST(request: NextRequest) {
  const {error} = await requireAdmin()
  if (error) return error

  let body: {name?: string; url?: string | null; active?: boolean}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({error: 'Name is required'}, {status: 400})
  }
  const url =
    typeof body.url === 'string' ? body.url.trim() || null : body.url ?? null
  const active = typeof body.active === 'boolean' ? body.active : true

  try {
    const row = await prisma.exchanges.create({
      data: {name, url, active},
    })
    return NextResponse.json(toJson(row))
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'Exchange name already exists' : 'Failed to create'},
      {status: 400},
    )
  }
}

export async function PUT(request: NextRequest) {
  const {error} = await requireAdmin()
  if (error) return error

  let body: {id?: number; name?: string; url?: string | null; active?: boolean}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const id =
    typeof body.id === 'number'
      ? body.id
      : typeof body.id === 'string'
        ? parseInt(String(body.id), 10)
        : NaN
  if (!Number.isInteger(id)) {
    return NextResponse.json({error: 'Invalid id'}, {status: 400})
  }
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({error: 'Name is required'}, {status: 400})
  }
  const url =
    typeof body.url === 'string' ? body.url.trim() || null : body.url
  const active = typeof body.active === 'boolean' ? body.active : undefined

  const existing = await prisma.exchanges.findUnique({where: {id}})
  if (!existing) {
    return NextResponse.json({error: 'Not found'}, {status: 404})
  }

  const data: {name: string; url: string | null; active?: boolean; updated_at: Date} = {
    name,
    url: url ?? existing.url,
    updated_at: new Date(),
  }
  if (active !== undefined) data.active = active

  try {
    const row = await prisma.exchanges.update({
      where: {id},
      data,
    })
    return NextResponse.json(toJson(row))
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'Exchange name already exists' : 'Failed to update'},
      {status: 400},
    )
  }
}

export async function DELETE(request: NextRequest) {
  const {error} = await requireAdmin()
  if (error) return error

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
            ? parseInt(String(body.id), 10)
            : NaN
    } catch {
      return NextResponse.json({error: 'Invalid request'}, {status: 400})
    }
  }
  if (!Number.isInteger(id)) {
    return NextResponse.json({error: 'Invalid id'}, {status: 400})
  }

  const existing = await prisma.exchanges.findUnique({where: {id}})
  if (!existing) {
    return NextResponse.json({error: 'Not found'}, {status: 404})
  }
  await prisma.exchanges.update({
    where: {id},
    data: {active: false, updated_at: new Date()},
  })
  return NextResponse.json({ok: true})
}
