'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'

export type AvailableExchange = {
  id: number
  name: string
  url: string | null
}

export type UserExchangeItem = {
  id: number
  exchange_id: number
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
  const [availableExchanges, setAvailableExchanges] = useState<AvailableExchange[]>([])
  const [userExchanges, setUserExchanges] = useState<UserExchangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    exchange_id: '' as number | '',
    api_key: '',
    api_secret: '',
  })

  const fetchAvailable = async () => {
    const res = await fetch('/api/exchanges/available')
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) return
    const data = await res.json()
    setAvailableExchanges(Array.isArray(data) ? data : [])
  }

  const fetchUserExchanges = async () => {
    const res = await fetch('/api/exchange')
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setMessage({type: 'error', text: 'Failed to load your exchanges.'})
      return
    }
    const data = await res.json()
    setUserExchanges(Array.isArray(data) ? data : [])
  }

  const load = async () => {
    setLoading(true)
    setMessage(null)
    try {
      await Promise.all([fetchAvailable(), fetchUserExchanges()])
    } catch {
      setMessage({type: 'error', text: 'Failed to load.'})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const res = await fetch('/api/exchange')
      if (cancelled) return
      if (res.status === 401) {
        router.push(`/${locale}`)
        return
      }
      const availRes = await fetch('/api/exchanges/available')
      if (cancelled) return
      if (availRes.status === 401) {
        router.push(`/${locale}`)
        return
      }
      const data = await res.json().catch(() => [])
      const avail = await availRes.json().catch(() => [])
      if (!cancelled) {
        setUserExchanges(Array.isArray(data) ? data : [])
        setAvailableExchanges(Array.isArray(avail) ? avail : [])
      }
    }
    run().finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [locale, router])

  const exchangesToOffer = availableExchanges.filter(
    ex => !userExchanges.some(ue => ue.exchange_id === ex.id),
  )

  const setEditing = (ue: UserExchangeItem | null) => {
    setEditingId(ue?.id ?? null)
    setForm({
      exchange_id: ue?.exchange_id ?? '',
      api_key: '',
      api_secret: '',
    })
    setMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setSubmitting(true)
    try {
      if (editingId != null) {
        const res = await fetch('/api/exchange', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: editingId,
            ...(form.api_key !== '' && {api_key: form.api_key}),
            ...(form.api_secret !== '' && {api_secret: form.api_secret}),
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'update_failed'
          const text =
            err === 'not_found'
              ? 'Connection not found.'
              : 'Failed to update. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'API keys updated.'})
        setEditing(null)
        setForm({exchange_id: '', api_key: '', api_secret: ''})
      } else {
        const exchangeId = form.exchange_id === '' ? NaN : Number(form.exchange_id)
        if (!Number.isInteger(exchangeId)) {
          setMessage({type: 'error', text: 'Please select an exchange.'})
          return
        }
        const res = await fetch('/api/exchange', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            exchange_id: exchangeId,
            api_key: form.api_key.trim() || null,
            api_secret: form.api_secret.trim() || null,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'create_failed'
          const text =
            err === 'exchange_not_found'
              ? 'Selected exchange is not available.'
              : err === 'already_connected'
                ? 'You have already added this exchange.'
                : 'Failed to add exchange. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'Exchange added.'})
        setForm({exchange_id: '', api_key: '', api_secret: ''})
      }
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Remove this exchange connection?')) return
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
        text: data?.error === 'not_found' ? 'Connection not found.' : 'Failed to remove.',
      })
      return
    }
    setMessage({type: 'success', text: 'Exchange removed.'})
    if (editingId === id) setEditing(null)
    await load()
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Exchanges
      </h1>

      <section className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
          {editingId != null ? 'Edit API keys' : 'Add exchange'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {editingId == null ? (
            <div className="sm:col-span-2">
              <label htmlFor="exchange_id" className={`block ${labelClass} mb-1.5`}>
                Exchange <span className="text-amber-600 dark:text-amber-400">*</span>
              </label>
              <select
                id="exchange_id"
                required
                value={form.exchange_id === '' ? '' : String(form.exchange_id)}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    exchange_id: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
                className={inputClass}
              >
                <option value="">Select an exchange</option>
                {exchangesToOffer.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              {exchangesToOffer.length === 0 && availableExchanges.length > 0 && (
                <p className="text-sm text-[var(--foreground)]/60 mt-1">
                  You have already added all available exchanges.
                </p>
              )}
            </div>
          ) : (
            <div className="sm:col-span-2 text-sm text-[var(--foreground)]/70">
              Editing connection for:{' '}
              <strong>
                {userExchanges.find(ue => ue.id === editingId)?.name ?? '—'}
              </strong>
            </div>
          )}
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
        ) : userExchanges.length === 0 ? (
          <p className="text-[var(--foreground)]/80">
            No exchanges yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--foreground)]/10 rounded-xl border border-[var(--foreground)]/15 overflow-hidden">
            {userExchanges.map(ue => (
              <li
                key={ue.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-[var(--background)] px-4 py-3 sm:px-5 sm:py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[var(--foreground)] truncate">
                    {ue.name}
                  </p>
                  {ue.url && (
                    <p className="text-sm text-[var(--foreground)]/70 truncate">
                      {ue.url}
                    </p>
                  )}
                  <p className="text-xs text-[var(--foreground)]/50 mt-0.5">
                    {ue.hasApiKey ? 'API key set' : 'No API key'} ·{' '}
                    {ue.hasApiSecret ? 'API secret set' : 'No API secret'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditing(ue)}
                    className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ue.id)}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  >
                    Remove
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
