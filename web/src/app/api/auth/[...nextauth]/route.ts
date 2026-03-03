import NextAuth from 'next-auth'
import {authConfig} from '@/lib/auth.config'

// Force dynamic rendering - this route requires runtime environment variables and database connections
export const dynamic = 'force-dynamic'

/**
 * NextAuth route handler for authentication
 *
 * Callbacks for successful logins with OAuth providers (Google, Apple, LINE):
 * - signIn: Handles user creation/update in database for OAuth providers
 *   - Creates new users if they don't exist
 *   - Updates existing users (verification, provider, image)
 *   - Returns true on successful authentication
 *
 * - redirect: Handles post-login redirects
 *   - Ensures redirects are to same origin
 *   - Defaults to home page after successful login
 *
 * - jwt: Manages JWT token creation and refresh
 *   - Stores user id, role, and preferences in token
 *   - Refreshes user data from database on token refresh
 *
 * - session: Populates session with user data
 *   - Adds user id, role, and preferences to session
 */
const handler = NextAuth(authConfig)

export {handler as GET, handler as POST}
