import {NextRequest, NextResponse} from 'next/server'
import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'

function unauthorized() {
  return NextResponse.json({error: 'Unauthorized'}, {status: 401})
}

type RouteParams = {params: Promise<{network: string}>}

function decodeNetwork(raw: string): string {
  return decodeURIComponent(raw)
}

export async function GET(request: NextRequest, {params}: RouteParams) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()
  const {network} = await params
  const networkName = decodeNetwork(network)
  const tokens = await prisma.contracts.findMany({
    where: {user_id: session.user.id, network: networkName},
    orderBy: {token: 'asc'},
  })
  return NextResponse.json(tokens)
}

export async function POST(request: NextRequest, {params}: RouteParams) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()
  const {network} = await params
  const networkName = decodeNetwork(network)
  let body: {token?: string; address?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!token || !address) {
    return NextResponse.json({error: 'token_and_address_required'}, {status: 400})
  }
  try {
    const row = await prisma.contracts.create({
      data: {
        user_id: session.user.id,
        network: networkName,
        token,
        address,
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
      {error: isUnique ? 'duplicate_token' : 'create_failed'},
      {status: 400},
    )
  }
}

export async function PUT(request: NextRequest, {params}: RouteParams) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()
  const {network} = await params
  const networkName = decodeNetwork(network)
  let body: {currentToken?: string; token?: string; address?: string}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({error: 'Invalid JSON'}, {status: 400})
  }
  const currentToken =
    typeof body.currentToken === 'string' ? body.currentToken.trim() : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!currentToken || !token || !address) {
    return NextResponse.json({error: 'token_and_address_required'}, {status: 400})
  }
  const existing = await prisma.contracts.findFirst({
    where: {
      user_id: session.user.id,
      network: networkName,
      token: currentToken,
    },
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  try {
    const updated = await prisma.contracts.update({
      where: {network_token: {network: networkName, token: currentToken}},
      data: {token, address, updated_at: new Date()},
    })
    return NextResponse.json(updated)
  } catch (e: unknown) {
    const isUnique =
      e &&
      typeof e === 'object' &&
      'code' in e &&
      (e as {code: string}).code === 'P2002'
    return NextResponse.json(
      {error: isUnique ? 'duplicate_token' : 'update_failed'},
      {status: 400},
    )
  }
}

export async function DELETE(request: NextRequest, {params}: RouteParams) {
  const session = await auth()
  if (!session?.user?.isActive || !session.user.id) return unauthorized()
  const {network} = await params
  const networkName = decodeNetwork(network)
  const url = new URL(request.url)
  const token = url.searchParams.get('token')?.trim()
  if (!token) {
    return NextResponse.json({error: 'token_required'}, {status: 400})
  }
  const existing = await prisma.contracts.findFirst({
    where: {
      user_id: session.user.id,
      network: networkName,
      token,
    },
  })
  if (!existing) {
    return NextResponse.json({error: 'not_found'}, {status: 404})
  }
  await prisma.contracts.delete({
    where: {network_token: {network: networkName, token}},
  })
  return NextResponse.json({ok: true})
}
