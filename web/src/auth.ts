import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import {PrismaAdapter} from '@auth/prisma-adapter'
import {prisma} from '@/lib/prisma'

const FIVE_MINUTES = 5 * 60
const ONE_MINUTE = 60

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  session: {
    maxAge: FIVE_MINUTES,
    updateAge: ONE_MINUTE,
  },
  callbacks: {
    signIn: async ({user}): Promise<boolean> => {
      if (!user.email) {
        return false
      }
      const email = user.email.toLowerCase()
      const onWhitelist = await prisma.whitelist.findUnique({
        where: {email},
      })
      if (!onWhitelist) {
        return false
      }
      const dbUser = await prisma.user.findUnique({
        where: {email: user.email},
      })
      if (!dbUser) {
        return true
      }
      if (!dbUser.isActive) {
        return false
      }
      return true
    },
    redirect({url, baseUrl}) {
      return '/'
    },
    session: async ({session, user}) => {
      session.user.id = user.id
      if (session.user.email) {
        const dbUser = await prisma.user.findUnique({
          where: {email: session.user.email},
        })
        session.user.isActive = dbUser?.isActive ?? false
        session.user.isAdmin = dbUser?.isAdmin ?? false
      }
      return session
    },
  },
})
