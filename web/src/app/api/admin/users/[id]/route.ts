import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return {error: unauthorized(), session: null}
  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {isAdmin: true},
  })
  if (!user?.isAdmin) return {error: unauthorized(), session: null}
  return {error: null, session}
}

export async function GET(
  _request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const {error} = await requireAdmin()
  if (error) return error

  const {id} = await params
  const user = await prisma.user.findUnique({
    where: {id},
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!user) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  return NextResponse.json(user)
}

export async function PATCH(
  request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const {error} = await requireAdmin()
  if (error) return error

  const {id} = await params
  const existing = await prisma.user.findUnique({where: {id}})
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  let body: {
    name?: string | null
    email?: string
    isAdmin?: boolean
    isActive?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }

  const name =
    body.name !== undefined
      ? (typeof body.name === 'string' ? body.name.trim() || null : null)
      : undefined
  const email =
    typeof body.email === 'string' ? body.email.trim() : undefined
  const isAdmin =
    typeof body.isAdmin === 'boolean' ? body.isAdmin : undefined
  const isActive =
    typeof body.isActive === 'boolean' ? body.isActive : undefined

  if (email !== undefined && !email) {
    return NextResponse.json({error: 'email_required'}, {status: 400})
  }

  const data: {
    name?: string | null
    email?: string
    isAdmin?: boolean
    isActive?: boolean
  } = {}
  if (name !== undefined) data.name = name
  if (email !== undefined) data.email = email
  if (isAdmin !== undefined) data.isAdmin = isAdmin
  if (isActive !== undefined) data.isActive = isActive

  if (Object.keys(data).length === 0) {
    return NextResponse.json(existing)
  }

  try {
    const user = await prisma.user.update({
      where: {id},
      data,
    })
    if (isActive === false) {
      await prisma.session.deleteMany({where: {userId: id}})
    }
    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_email' : 'update_failed'},
      {status: 400},
    )
  }
}
