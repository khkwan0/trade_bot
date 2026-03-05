import {NextResponse} from 'next/server'
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

export async function GET() {
  const {error} = await requireAdmin()
  if (error) return error

  const users = await prisma.user.findMany({
    orderBy: {createdAt: 'desc'},
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
  return NextResponse.json(users)
}
