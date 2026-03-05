import 'next-auth'
import {UserPreferences} from '@/context/global-state'

declare module 'next-auth' {
  interface User {
    id?: string
    isActive?: boolean
    isAdmin?: boolean
    preferences?: UserPreferences
  }

  interface Session {
    user: User
  }
}
