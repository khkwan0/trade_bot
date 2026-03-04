import {auth} from '@/auth'
import {prisma} from '@/lib/prisma'
import {revalidatePath} from 'next/cache'
import {redirect} from 'next/navigation'

type Props = {
  params: Promise<{locale: string}>
  searchParams: Promise<{error?: string; linked?: string}>
}

async function linkTelegram(userId: string, locale: string, formData: FormData) {
  'use server'
  const raw = formData.get('tg_id')
  const tgId = typeof raw === 'string' ? raw.trim() : ''
  const num = Number(tgId)
  if (!Number.isInteger(num) || num < 1) {
    redirect(`/${locale}/dashboard/telegram?error=invalid`)
  }
  const existing = await prisma.telegram.findFirst({
    where: {user_id: userId, tg_id: num},
  })
  if (existing) {
    redirect(`/${locale}/dashboard/telegram?error=already_linked`)
  }
  await prisma.telegram.create({
    data: {user_id: userId, tg_id: num},
  })
  revalidatePath(`/${locale}/dashboard/telegram`)
  redirect(`/${locale}/dashboard/telegram?linked=1`)
}

async function deleteTelegram(userId: string, locale: string, formData: FormData) {
  'use server'
  const raw = formData.get('tg_id')
  const tgId = typeof raw === 'string' ? raw.trim() : ''
  const num = Number(tgId)
  if (!Number.isInteger(num) || num < 1) return
  await prisma.telegram.deleteMany({
    where: {user_id: userId, tg_id: num},
  })
  revalidatePath(`/${locale}/dashboard/telegram`)
}

export default async function TelegramPage({params, searchParams}: Props) {
  const {locale} = await params
  const session = await auth()

  if (!session?.user?.isActive || !session.user.id) {
    redirect(`/${locale}`)
  }

  const [{error, linked}, telegrams] = await Promise.all([
    searchParams,
    prisma.telegram.findMany({
      where: {user_id: session.user.id},
      select: {tg_id: true},
    }),
  ])

  const telegramIds = telegrams.map(t => t.tg_id)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Telegram
      </h1>

      <form
        action={linkTelegram.bind(null, session.user.id, locale)}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-[var(--foreground)]">
            Link Telegram ID
          </span>
          <input
            type="text"
            name="tg_id"
            inputMode="numeric"
            pattern="[0-9]+"
            placeholder="e.g. 123456789"
            className="rounded-lg border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 min-w-[12rem]"
            required
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)]"
        >
          Link
        </button>
      </form>

      {error === 'invalid' && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Please enter a valid numeric Telegram ID.
        </p>
      )}
      {error === 'already_linked' && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          This Telegram ID is already linked to your account.
        </p>
      )}
      {linked === '1' && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          Telegram ID linked successfully.
        </p>
      )}

      {telegramIds.length === 0 ? (
        <p className="text-[var(--foreground)]/80">
          No Telegram accounts linked yet.
        </p>
      ) : (
        <>
          <h2 className="text-lg font-medium text-[var(--foreground)]">
            Linked IDs
          </h2>
          <ul className="flex flex-col gap-2 text-[var(--foreground)]">
            {telegramIds.map(tgId => (
              <li key={tgId} className="flex items-center gap-2">
                <span>{tgId}</span>
                <form
                  action={deleteTelegram.bind(null, session.user.id!, locale)}
                  className="inline"
                >
                  <input type="hidden" name="tg_id" value={tgId} />
                  <button
                    type="submit"
                    aria-label={`Delete Telegram ID ${tgId}`}
                    className="rounded p-1 text-[var(--foreground)]/60 transition hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
