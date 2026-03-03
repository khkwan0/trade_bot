import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'

const SALT_ROUNDS = 10

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      return NextResponse.json(
        { error: 'Email is required.' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const [existing] = await db`
      SELECT id FROM users WHERE email = ${trimmedEmail}
    `

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    await db`
      INSERT INTO users (email, password, active)
      VALUES (${trimmedEmail}, ${hashedPassword}, true)
    `

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Registration error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
