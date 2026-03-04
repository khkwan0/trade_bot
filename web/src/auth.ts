import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import {PrismaAdapter} from '@auth/prisma-adapter'
import {prisma} from '@/lib/prisma'

export const {handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    signIn: async ({user}): Promise<boolean> => {
      console.log('signIn', user)
      if (!user.email) {
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
      }
      return session
    },
  },
})
