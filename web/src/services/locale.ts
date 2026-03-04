import {cookies} from 'next/headers'
import {Locale, defaultLocale} from '@/i18n/config'
import {auth} from '@/auth'

// In this example the locale is read from a cookie. You could alternatively
// also read it from a database, backend service, or any other source.
const COOKIE_NAME = 'NEXT_LOCALE'

export async function getUserLocale() {
  return (await cookies()).get(COOKIE_NAME)?.value || defaultLocale
}

export async function setUserLocale(locale: Locale) {
  ;(await cookies()).set(COOKIE_NAME, locale)
}

// Get locale from session preferences and set cookie
export async function getLocaleFromPreferencesAndSetCookie(): Promise<Locale | null> {
  try {
    const session = await auth()
    const preferences = session?.user?.preferences as
      | {language?: string}
      | undefined
    if (preferences?.language) {
      const locale = preferences.language as Locale
      await setUserLocale(locale)
      return locale
    }
  } catch (error) {
    console.error('Error getting locale from preferences:', error)
  }
  return null
}