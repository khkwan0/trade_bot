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
  return {error: null, session: null}
}

export async function POST(
  _request: NextRequest,
  {params}: {params: Promise<{id: string}>},
) {
  const {error} = await requireAdmin()
  if (error) return error

  const {id} = await params
  const existing = await prisma.user.findUnique({where: {id}})
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }

  await prisma.session.deleteMany({where: {userId: id}})
  return NextResponse.json({ok: true})
}
