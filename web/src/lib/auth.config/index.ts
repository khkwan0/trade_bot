import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcrypt'
import type {NextAuthOptions} from 'next-auth'

export const authConfig: NextAuthOptions = {
  trustHost: true, // Use X-Forwarded-Host/Proto when behind a proxy so redirects (e.g. logout) use the public URL
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: {label: 'Email', type: 'email'},
        password: {label: 'Password', type: 'password'},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const [user] = await db`
            SELECT * FROM users WHERE email ILIKE ${credentials.email} and active = true
          `

          if (!user) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password,
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id.toString(),
            email: user.email,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({token, user}) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({session, token}) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}