'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

export type WhitelistRow = {
  email: string
  createdAt: string
  updatedAt: string
}

const btnClass =
  'rounded px-2 py-1 text-sm border border-[var(--foreground)]/30 hover:bg-[var(--foreground)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 disabled:opacity-50'

type Props = {
  entries: WhitelistRow[]
}

export function WhitelistTable({entries}: Props) {
  const router = useRouter()
  const [busyEmail, setBusyEmail] = useState<string | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [addBusy, setAddBusy] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = addEmail.trim().toLowerCase()
    if (!email) return
    setAddError(null)
    setAddBusy(true)
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setAddEmail('')
        router.refresh()
      } else {
        setAddError(data.error ?? 'Failed to add email')
      }
    } finally {
      setAddBusy(false)
    }
  }

  const handleRemove = async (email: string) => {
    setBusyEmail(email)
    try {
      const res = await fetch('/api/admin/whitelist', {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email}),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setBusyEmail(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <label className="sr-only" htmlFor="whitelist-email">
          Email address
        </label>
        <input
          id="whitelist-email"
          type="email"
          value={addEmail}
          onChange={e => {
            setAddEmail(e.target.value)
            setAddError(null)
          }}
          placeholder="email@example.com"
          className="rounded border border-[var(--foreground)]/30 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
          disabled={addBusy}
          autoComplete="email"
        />
        <button
          type="submit"
          className={btnClass}
          disabled={addBusy || !addEmail.trim()}
        >
          {addBusy ? 'Adding…' : 'Add'}
        </button>
      </form>
      {addError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {addError}
        </p>
      )}

      <table className="w-full">
        <thead className="text-left text-sm text-[var(--foreground)]/50">
          <tr>
            <th className="pb-2">Email</th>
            <th className="pb-2">Added</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm text-[var(--foreground)]">
          {entries.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 text-center text-[var(--foreground)]/50">
                No whitelisted emails yet. Add one above.
              </td>
            </tr>
          ) : (
            entries.map(row => (
              <tr
                key={row.email}
                className="border-t border-[var(--foreground)]/10"
              >
                <td className="py-2">{row.email}</td>
                <td className="py-2 text-[var(--foreground)]/70">
                  {new Date(row.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2 text-right">
                  <button
                    type="button"
                    className={btnClass}
                    disabled={busyEmail === row.email}
                    onClick={() => handleRemove(row.email)}
                    title="Remove from whitelist"
                  >
                    {busyEmail === row.email ? '…' : 'Remove'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
