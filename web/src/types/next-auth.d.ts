import 'next-auth'

declare module 'next-auth' {
  interface User {
    isActive?: boolean
  }

  interface Session {
    user: User
  }
}
