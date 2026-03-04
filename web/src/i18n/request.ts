import {getRequestConfig} from 'next-intl/server'
import {getUserLocale} from '@/services/locale'
import {auth} from '@/auth'

export default getRequestConfig(async ({requestLocale}) => {
  /*
  // Priority: URL parameter > Session Preferences (if logged in) > Cookie > Default
  let locale = await requestLocale

  if (!locale) {
    // If no URL locale, check session preferences first (if user is logged in)
    try {
      const session = await auth()
      const preferences = session?.user?.preferences as
        | {language?: string}
        | undefined
      if (preferences?.language) {
        locale = preferences.language
      }
    } catch (error) {
      // Silently fail if session check fails
      console.error('Error checking session for locale:', error)
    }

    // Fallback to cookie if no session preference
    if (!locale) {
      locale = await getUserLocale()
    }
  }
    */
  const locale = 'en'
  return {
    locale,
    messages: (await import(`../translations/${locale}.json`)).default,
  }
})
