import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return {error: unauthorized(), user: null}
  // User id from session; isAdmin from DB so role changes take effect immediately
  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {isAdmin: true},
  })
  if (!user?.isAdmin) return {error: unauthorized(), user: null}
  return {error: null, user: session.user}
}

export async function GET() {
  const {error} = await requireAdmin()
  if (error) return error

  const entries = await prisma.whitelist.findMany({
    orderBy: {created_at: 'asc'},
  })
  return NextResponse.json(
    entries.map(e => ({
      email: e.email,
      createdAt: e.created_at.toISOString(),
      updatedAt: e.updated_at.toISOString(),
    })),
  )
}

export async function POST(request: NextRequest) {
  const {error} = await requireAdmin()
  if (error) return error

  let body: {email?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const raw = typeof body.email === 'string' ? body.email.trim() : ''
  const email = raw.toLowerCase()
  if (!email) {
    return NextResponse.json({error: 'Email is required'}, {status: 400})
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({error: 'Invalid email format'}, {status: 400})
  }

  try {
    const entry = await prisma.whitelist.create({
      data: {email},
    })
    return NextResponse.json({
      email: entry.email,
      createdAt: entry.created_at.toISOString(),
      updatedAt: entry.updated_at.toISOString(),
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'Email already on whitelist' : 'Failed to add email'},
      {status: 400},
    )
  }
}

export async function DELETE(request: NextRequest) {
  const {error} = await requireAdmin()
  if (error) return error

  let body: {email?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const email =
    typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    return NextResponse.json({error: 'Email is required'}, {status: 400})
  }

  await prisma.whitelist.deleteMany({where: {email}})
  return NextResponse.json({ok: true})
}
