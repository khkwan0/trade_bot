'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'

export type ExchangeItem = {
  id: number
  name: string
  url: string | null
  hasApiKey: boolean
  hasApiSecret: boolean
  active: boolean
  created_at: string
  updated_at: string
}

const inputClass =
  'rounded-lg border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 w-full min-w-0'
const labelClass = 'text-sm font-medium text-[var(--foreground)]'

type Props = {
  locale: string
}

export function ExchangesClient({locale}: Props) {
  const router = useRouter()
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    url: '',
    api_key: '',
    api_secret: '',
  })

  const fetchExchanges = async () => {
    const res = await fetch('/api/exchange')
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setMessage({type: 'error', text: 'Failed to load exchanges.'})
      return
    }
    const data = await res.json()
    setExchanges(data)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/exchange')
      .then(res => {
        if (cancelled) return
        if (res.status === 401) {
          router.push(`/${locale}`)
          return
        }
        return res.json()
      })
      .then(data => {
        if (!cancelled && Array.isArray(data)) setExchanges(data)
      })
      .catch(() => {
        if (!cancelled) setMessage({type: 'error', text: 'Failed to load exchanges.'})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale, router])

  const setEditing = (ex: ExchangeItem | null) => {
    setEditingId(ex?.id ?? null)
    setForm({
      name: ex?.name ?? '',
      url: ex?.url ?? '',
      api_key: '',
      api_secret: '',
    })
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const name = form.name.trim()
    if (!name) {
      setMessage({type: 'error', text: 'Name is required.'})
      return
    }
    setSubmitting(true)
    try {
      if (editingId != null) {
        const res = await fetch('/api/exchange', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: editingId,
            name,
            url: form.url.trim() || null,
            ...(form.api_key && {api_key: form.api_key}),
            ...(form.api_secret && {api_secret: form.api_secret}),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'update_failed'
          const text =
            err === 'name_required'
              ? 'Name is required.'
              : err === 'duplicate_name'
                ? 'An exchange with this name already exists for your account.'
                : err === 'not_found'
                  ? 'Exchange not found.'
                  : 'Failed to update exchange. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'Exchange updated.'})
        setEditing(null)
      } else {
        const res = await fetch('/api/exchange', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            name,
            url: form.url.trim() || null,
            api_key: form.api_key.trim() || null,
            api_secret: form.api_secret.trim() || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'create_failed'
          const text =
            err === 'name_required'
              ? 'Name is required.'
              : err === 'duplicate_name'
                ? 'An exchange with this name already exists for your account.'
                : 'Failed to create exchange. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'Exchange added.'})
        setForm({name: '', url: '', api_key: '', api_secret: ''})
      }
      await fetchExchanges()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this exchange?')) return
    setMessage(null)
    const res = await fetch(`/api/exchange?id=${id}`, {method: 'DELETE'})
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setMessage({
        type: 'error',
        text: data?.error === 'not_found' ? 'Exchange not found.' : 'Failed to delete exchange.',
      })
      return
    }
    setMessage({type: 'success', text: 'Exchange deleted.'})
    if (editingId === id) setEditing(null)
    await fetchExchanges()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Exchanges
      </h1>

      <section className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
          {editingId != null ? 'Edit exchange' : 'Add exchange'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={`block ${labelClass} mb-1.5`}>
              Name <span className="text-amber-600 dark:text-amber-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="e.g. Binance"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="url" className={`block ${labelClass} mb-1.5`}>
              API URL
            </label>
            <input
              id="url"
              type="url"
              value={form.url}
              onChange={e => setForm(f => ({...f, url: e.target.value}))}
              placeholder="https://api.example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="api_key" className={`block ${labelClass} mb-1.5`}>
              API key
            </label>
            <input
              id="api_key"
              type="password"
              autoComplete="off"
              value={form.api_key}
              onChange={e => setForm(f => ({...f, api_key: e.target.value}))}
              placeholder={editingId != null ? 'Leave blank to keep current' : undefined}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="api_secret" className={`block ${labelClass} mb-1.5`}>
              API secret
            </label>
            <input
              id="api_secret"
              type="password"
              autoComplete="off"
              value={form.api_secret}
              onChange={e => setForm(f => ({...f, api_secret: e.target.value}))}
              placeholder={editingId != null ? 'Leave blank to keep current' : undefined}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50"
            >
              {editingId != null ? 'Save' : 'Add exchange'}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-[var(--foreground)]/20 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 focus:ring-offset-2 focus:ring-offset-[var(--background)]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {message && (
        <p
          className={`text-sm ${
            message.type === 'error'
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {message.text}
        </p>
      )}

      <section>
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">
          Your exchanges
        </h2>
        {loading ? (
          <p className="text-[var(--foreground)]/80">Loading…</p>
        ) : exchanges.length === 0 ? (
          <p className="text-[var(--foreground)]/80">
            No exchanges yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--foreground)]/10 rounded-xl border border-[var(--foreground)]/15 overflow-hidden">
            {exchanges.map(ex => (
              <li
                key={ex.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-[var(--background)] px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {ex.name}
                  </p>
                  {ex.url && (
                    <p className="text-sm text-[var(--foreground)]/70 truncate">
                      {ex.url}
                    </p>
                  )}
                  <p className="text-xs text-[var(--foreground)]/50 mt-0.5">
                    {ex.hasApiKey ? 'API key set' : 'No API key'} ·{' '}
                    {ex.hasApiSecret ? 'API secret set' : 'No API secret'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(ex)}
                    className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ex.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
