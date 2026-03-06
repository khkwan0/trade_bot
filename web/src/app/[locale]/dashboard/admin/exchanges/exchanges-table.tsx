'use client'

import {useRouter} from 'next/navigation'
import {useState} from 'react'

export type ExchangeRow = {
  id: number
  name: string
  url: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

const btnClass =
  'rounded px-2 py-1 text-sm border border-[var(--foreground)]/30 hover:bg-[var(--foreground)]/10 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 disabled:opacity-50'
const inputClass =
  'rounded border border-[var(--foreground)]/30 bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20'

type Props = {
  entries: ExchangeRow[]
}

export function ExchangesTable({entries}: Props) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [addName, setAddName] = useState('')
  const [addUrl, setAddUrl] = useState('')
  const [addActive, setAddActive] = useState(true)
  const [addError, setAddError] = useState<string | null>(null)
  const [addBusy, setAddBusy] = useState(false)
  const [editForm, setEditForm] = useState<{
    name: string
    url: string
    active: boolean
  } | null>(null)
  const [editError, setEditError] = useState<string | null>(null)

  const startEdit = (row: ExchangeRow) => {
    setEditingId(row.id)
    setEditForm({
      name: row.name,
      url: row.url ?? '',
      active: row.active,
    })
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
    setEditError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = addName.trim()
    if (!name) return
    setAddError(null)
    setAddBusy(true)
    try {
      const res = await fetch('/api/admin/exchanges', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name,
          url: addUrl.trim() || null,
          active: addActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setAddName('')
        setAddUrl('')
        setAddActive(true)
        router.refresh()
      } else {
        setAddError(data.error ?? 'Failed to add exchange')
      }
    } finally {
      setAddBusy(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent, id: number) => {
    e.preventDefault()
    if (!editForm) return
    const name = editForm.name.trim()
    if (!name) return
    setEditError(null)
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/exchanges', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          id,
          name,
          url: editForm.url.trim() || null,
          active: editForm.active,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEditingId(null)
        setEditForm(null)
        router.refresh()
      } else {
        setEditError(data.error ?? 'Failed to update')
      }
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deactivate this exchange? It will be hidden from new connections but existing links stay.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/exchanges?id=${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (editingId === id) cancelEdit()
        router.refresh()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-wrap items-end gap-2">
          <label className="sr-only" htmlFor="exchange-name">
            Name
          </label>
          <input
            id="exchange-name"
            type="text"
            value={addName}
            onChange={e => {
              setAddName(e.target.value)
              setAddError(null)
            }}
            placeholder="Exchange name"
            className={inputClass}
            disabled={addBusy}
            autoComplete="off"
          />
          <label className="sr-only" htmlFor="exchange-url">
            URL
          </label>
          <input
            id="exchange-url"
            type="url"
            value={addUrl}
            onChange={e => setAddUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
            disabled={addBusy}
            autoComplete="off"
          />
          <label className="flex items-center gap-2 text-sm text-[var(--foreground)]/80">
            <input
              type="checkbox"
              checked={addActive}
              onChange={e => setAddActive(e.target.checked)}
              disabled={addBusy}
              className="rounded border-[var(--foreground)]/30"
            />
            Active
          </label>
        </div>
        <button
          type="submit"
          className={btnClass}
          disabled={addBusy || !addName.trim()}
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
            <th className="pb-2">Name</th>
            <th className="pb-2">URL</th>
            <th className="pb-2">Active</th>
            <th className="pb-2">Updated</th>
            <th className="pb-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm text-[var(--foreground)]">
          {entries.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="py-4 text-center text-[var(--foreground)]/50"
              >
                No exchanges yet. Add one above.
              </td>
            </tr>
          ) : (
            entries.map(row =>
              editingId === row.id && editForm ? (
                <tr
                  key={row.id}
                  className="border-t border-[var(--foreground)]/10"
                >
                  <td colSpan={5} className="py-2">
                    <form
                      onSubmit={e => handleUpdate(e, row.id)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e =>
                          setEditForm(f => (f ? {...f, name: e.target.value} : null))
                        }
                        placeholder="Name"
                        className={inputClass}
                        disabled={busyId === row.id}
                        autoFocus
                      />
                      <input
                        type="url"
                        value={editForm.url}
                        onChange={e =>
                          setEditForm(f => (f ? {...f, url: e.target.value} : null))
                        }
                        placeholder="URL"
                        className={inputClass}
                        disabled={busyId === row.id}
                      />
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm.active}
                          onChange={e =>
                            setEditForm(f =>
                              f ? {...f, active: e.target.checked} : null,
                            )
                          }
                          disabled={busyId === row.id}
                          className="rounded border-[var(--foreground)]/30"
                        />
                        Active
                      </label>
                      <button
                        type="submit"
                        className={btnClass}
                        disabled={busyId === row.id}
                      >
                        {busyId === row.id ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className={btnClass}
                        onClick={cancelEdit}
                        disabled={busyId === row.id}
                      >
                        Cancel
                      </button>
                    </form>
                    {editError && (
                      <p
                        className="mt-1 text-sm text-red-600 dark:text-red-400"
                        role="alert"
                      >
                        {editError}
                      </p>
                    )}
                  </td>
                </tr>
              ) : (
                <tr
                  key={row.id}
                  className="border-t border-[var(--foreground)]/10"
                >
                  <td className="py-2 font-medium">{row.name}</td>
                  <td className="py-2 text-[var(--foreground)]/70 max-w-[200px] truncate" title={row.url ?? undefined}>
                    {row.url || '—'}
                  </td>
                  <td className="py-2">
                    {row.active ? (
                      <span className="text-green-600 dark:text-green-400">Yes</span>
                    ) : (
                      <span className="text-[var(--foreground)]/50">No</span>
                    )}
                  </td>
                  <td className="py-2 text-[var(--foreground)]/70">
                    {new Date(row.updatedAt).toLocaleString()}
                  </td>
                  <td className="py-2 text-right">
                    <button
                      type="button"
                      className={btnClass}
                      disabled={busyId === row.id}
                      onClick={() => startEdit(row)}
                      title="Edit"
                    >
                      Edit
                    </button>
                    {' '}
                    <button
                      type="button"
                      className={btnClass}
                      disabled={busyId === row.id}
                      onClick={() => handleDelete(row.id)}
                      title="Deactivate (hide from new connections)"
                    >
                      {busyId === row.id ? '…' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  )
}
