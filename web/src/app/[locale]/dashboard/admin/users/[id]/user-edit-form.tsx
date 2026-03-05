'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

const inputClass =
  'rounded-lg border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 w-full min-w-0'
const labelClass = 'text-sm font-medium text-[var(--foreground)] block mb-1'
const btnClass =
  'rounded-lg border border-[var(--foreground)]/30 bg-[var(--foreground)]/5 px-4 py-2 text-[var(--foreground)] hover:bg-[var(--foreground)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 disabled:opacity-50'

type Props = {
  locale: string
  user: {
    id: string
    name: string
    email: string
    isAdmin: boolean
    isActive: boolean
  }
}

export function UserEditForm({locale, user}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [isAdmin, setIsAdmin] = useState(user.isAdmin)
  const [isActive, setIsActive] = useState(user.isActive)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: name.trim() || null,
          email: email.trim(),
          isAdmin,
          isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg =
          data.error === 'duplicate_email'
            ? 'That email is already in use.'
            : data.error === 'email_required'
              ? 'Email is required.'
              : 'Update failed.'
        setMessage({type: 'error', text: msg})
        return
      }
      router.push(`/${locale}/dashboard/admin/users`)
      router.refresh()
    } catch {
      setMessage({type: 'error', text: 'Update failed.'})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {message && (
        <p
          className={
            message.type === 'error'
              ? 'text-red-500 text-sm'
              : 'text-green-600 text-sm'
          }
        >
          {message.text}
        </p>
      )}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="name" className={labelClass}>
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isAdmin"
          type="checkbox"
          checked={isAdmin}
          onChange={e => setIsAdmin(e.target.checked)}
          className="rounded border-[var(--foreground)]/30"
        />
        <label htmlFor="isAdmin" className="text-sm text-[var(--foreground)]">
          Admin
        </label>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="rounded border-[var(--foreground)]/30"
        />
        <label htmlFor="isActive" className="text-sm text-[var(--foreground)]">
          Active (inactive users cannot sign in)
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" className={btnClass} disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <Link
          href={`/${locale}/dashboard/admin/users`}
          className={btnClass}
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
