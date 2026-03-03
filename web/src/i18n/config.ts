export type Locale = (typeof locales)[number]

export const locales = [
  'en',
  /*
  'id',
  'es',
  'zh-CN',
  'zh-TW',
  'ja',
  'it',
  'de',
  'ru',
  'fr',
  'nl',
  */
] as const

export const defaultLocale: Locale = 'en'