'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import {useState} from 'react'

export type UserRow = {
  id: string
  name: string | null
  email: string
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastActivity: string | null
  lastActivityLabel: string | null
  isOnline: boolean
}

const btnClass =
  'rounded px-2 py-1 text-sm border border-[var(--foreground)]/30 hover:bg-[var(--foreground)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 disabled:opacity-50'

type Props = {
  locale: string
  users: UserRow[]
}

export function UsersTable({locale, users}: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(true)

  const visibleUsers = showInactive
    ? users
    : users.filter(u => u.isActive)

  const setActive = async (id: string, isActive: boolean) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({isActive}),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  const kickUser = async (id: string) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/users/${id}/kick`, {method: 'POST'})
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          id="show-inactive"
          type="checkbox"
          checked={showInactive}
          onChange={e => setShowInactive(e.target.checked)}
          className="rounded border-[var(--foreground)]/30"
        />
        <label
          htmlFor="show-inactive"
          className="text-sm text-[var(--foreground)] cursor-pointer"
        >
          Show inactive users
        </label>
      </div>
      <table className="w-full">
      <thead className="text-left text-sm text-[var(--foreground)]/50">
        <tr>
          <th className="pb-2">Email</th>
          <th className="pb-2">Name</th>
          <th className="pb-2">Admin</th>
          <th className="pb-2">Status</th>
          <th className="pb-2">Online</th>
          <th className="pb-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm text-[var(--foreground)]">
        {visibleUsers.map(user => (
          <tr key={user.id} className="border-t border-[var(--foreground)]/10">
            <td className="py-2">{user.email}</td>
            <td className="py-2">{user.name ?? '—'}</td>
            <td className="py-2">{user.isAdmin ? 'Yes' : 'No'}</td>
            <td className="py-2">
              <span
                className={
                  user.isActive
                    ? 'text-[var(--foreground)]'
                    : 'text-[var(--foreground)]/50'
                }
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="py-2">
              {user.lastActivity ? (
                <span
                  className={
                    user.isOnline
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-[var(--foreground)]/50'
                  }
                  title={user.lastActivityLabel ?? undefined}
                >
                  {user.isOnline ? (
                    <>
                      <span className="inline-block w-2 h-2 rounded-full bg-current mr-1.5 align-middle" aria-hidden />
                      Online
                    </>
                  ) : (
                    'Offline'
                  )}
                </span>
              ) : (
                <span className="text-[var(--foreground)]/50">—</span>
              )}
            </td>
            <td className="py-2 text-right">
              <Link
                href={`/${locale}/dashboard/admin/users/${user.id}`}
                className={`${btnClass} mr-2`}
              >
                Edit
              </Link>
              <button
                type="button"
                className={btnClass}
                disabled={busyId === user.id}
                onClick={() => kickUser(user.id)}
                title="Log out this user on all devices"
              >
                {busyId === user.id ? '…' : 'Kick'}
              </button>
              {user.isActive ? (
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyId === user.id}
                  onClick={() => setActive(user.id, false)}
                >
                  {busyId === user.id ? '…' : 'Deactivate'}
                </button>
              ) : (
                <button
                  type="button"
                  className={btnClass}
                  disabled={busyId === user.id}
                  onClick={() => setActive(user.id, true)}
                >
                  {busyId === user.id ? '…' : 'Reactivate'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}
