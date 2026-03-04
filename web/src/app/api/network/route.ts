import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()

  const list = await prisma.networks.findMany({
    where: {user_id: session.user.id},
    orderBy: {network: 'asc'},
    select: {network: true, created_at: true, updated_at: true},
  })
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()

  let body: {network?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const name = typeof body.network === 'string' ? body.network.trim() : ''
  if (!name) {
    return NextResponse.json({error: 'name_required'}, {status: 400})
  }
  try {
    const row = await prisma.networks.create({
      data: {
        user_id: session.user.id,
        network: name,
      },
    })
    return NextResponse.json(row)
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_name' : 'create_failed'},
      {status: 400},
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()

  let body: {currentName?: string; newName?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const currentName =
    typeof body.currentName === 'string' ? body.currentName.trim() : ''
  const newName =
    typeof body.newName === 'string' ? body.newName.trim() : ''
  if (!currentName || !newName) {
    return NextResponse.json({error: 'name_required'}, {status: 400})
  }
  const existing = await prisma.networks.findFirst({
    where: {user_id: session.user.id, network: currentName},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  try {
    await prisma.networks.update({
      where: {network: currentName},
      data: {network: newName, updated_at: new Date()},
    })
    const updated = await prisma.networks.findFirst({
      where: {network: newName},
    })
    return NextResponse.json(updated)
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
  if (!session?.user?.isActive || !session.user.id) return unauthorized()

  const url = new URL(request.url)
  const name = url.searchParams.get('name')?.trim()
  if (!name) {
    return NextResponse.json({error: 'name_required'}, {status: 400})
  }
  const existing = await prisma.networks.findFirst({
    where: {user_id: session.user.id, network: name},
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  await prisma.networks.delete({where: {network: name}})
  return NextResponse.json({ok: true})
}
