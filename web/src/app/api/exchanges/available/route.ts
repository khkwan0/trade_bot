import {NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

/** Returns active exchanges from the exchanges table (for dropdown / add form). */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return unauthorized()

  const rows = await prisma.exchanges.findMany({
    where: {active: true},
    orderBy: {name: 'asc'},
    select: {
      id: true,
      name: true,
      url: true,
    },
  })
  return NextResponse.json(
    rows.map(r => ({
      id: r.id,
      name: r.name,
      url: r.url ?? null,
    })),
  )
}
