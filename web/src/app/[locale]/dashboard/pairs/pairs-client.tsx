'use client'

import {useCallback, useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'

type ExchangeItem = {
  id: number
  name: string
  url: string | null
  hasApiKey: boolean
  hasApiSecret: boolean
  active: boolean
  created_at: string
  updated_at: string
}

type PairItem = {
  id: number
  exchange_id: number
  base_currency: string
  quote_currency: string
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

export function PairsClient({locale}: Props) {
  const router = useRouter()
  const [exchanges, setExchanges] = useState<ExchangeItem[]>([])
  const [pairs, setPairs] = useState<PairItem[]>([])
  const [loadingExchanges, setLoadingExchanges] = useState(true)
  const [loadingPairs, setLoadingPairs] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [selectedExchangeId, setSelectedExchangeId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({
    base_currency: '',
    quote_currency: '',
  })
  const [baseSymbols, setBaseSymbols] = useState<string[]>([])
  const [quoteSymbols, setQuoteSymbols] = useState<string[]>([])
  const [loadingSymbols, setLoadingSymbols] = useState(false)

  const fetchSymbolsForExchange = useCallback(async (exchangeName: string) => {
    if (!exchangeName.trim()) return
    setLoadingSymbols(true)
    setBaseSymbols([])
    setQuoteSymbols([])
    try {
      const res = await fetch(`/api/symbols?exchange=${encodeURIComponent(exchangeName)}`)
      if (res.status === 401) {
        router.push(`/${locale}`)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.bases)) setBaseSymbols(data.bases)
      if (Array.isArray(data.quotes)) setQuoteSymbols(data.quotes)
    } finally {
      setLoadingSymbols(false)
    }
  }, [locale, router])

  const fetchPairs = useCallback(async (exchangeId: number) => {
    setLoadingPairs(true)
    setMessage(null)
    const res = await fetch(`/api/pair?exchange_id=${exchangeId}`)
    setLoadingPairs(false)
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setMessage({type: 'error', text: 'Failed to load pairs.'})
      return
    }
    const data = await res.json()
    setPairs(data)
  }, [locale, router])

  useEffect(() => {
    let cancelled = false
    setLoadingExchanges(true)
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
        if (!cancelled && Array.isArray(data)) {
          setExchanges(data)
          if (data.length > 0 && selectedExchangeId === null) {
            setSelectedExchangeId(data[0].id)
          }
        }
      })
      .catch(() => {
        if (!cancelled) setMessage({type: 'error', text: 'Failed to load exchanges.'})
      })
      .finally(() => {
        if (!cancelled) setLoadingExchanges(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale, router])

  useEffect(() => {
    if (selectedExchangeId == null) return
    fetchPairs(selectedExchangeId)
  }, [selectedExchangeId, fetchPairs])

  const selectedExchange = exchanges.find(e => e.id === selectedExchangeId) ?? null
  const isJupiter = selectedExchange?.name?.toLowerCase() === 'jupiter'
  const isBitkub = selectedExchange?.name?.toLowerCase() === 'bitkub'
  const isKraken = selectedExchange?.name?.toLowerCase() === 'kraken'

  useEffect(() => {
    if (isKraken && selectedExchange?.name) {
      fetchSymbolsForExchange(selectedExchange.name)
    }
  }, [isKraken, selectedExchange?.name, fetchSymbolsForExchange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const base = form.base_currency.trim().toUpperCase()
    const quote =
      isJupiter ? 'USD' : isBitkub ? 'THB' : form.quote_currency.trim().toUpperCase()
    if (!base || !quote) {
      setMessage({type: 'error', text: 'Base and quote currency are required.'})
      return
    }
    if (selectedExchangeId == null) {
      setMessage({type: 'error', text: 'Please select an exchange.'})
      return
    }
    setSubmitting(true)
    setMessage(null)
    const url = '/api/pair'
    const method = editingId != null ? 'PUT' : 'POST'
    const body =
      method === 'PUT'
        ? {id: editingId, base_currency: base, quote_currency: quote}
        : {
            exchange_id: selectedExchangeId,
            base_currency: base,
            quote_currency: quote,
          }
    const res = await fetch(url, {
      method,
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    })
    setSubmitting(false)
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const err =
        data.error === 'fields_required' || data.error === 'base_currency and quote_currency required'
          ? 'Base and quote currency are required.'
          : data.error === 'duplicate_pair'
            ? 'This pair already exists on this exchange.'
            : data.error === 'not_found'
              ? 'Exchange or pair not found.'
              : 'Request failed. Please try again.'
      setMessage({type: 'error', text: err})
      return
    }
    setMessage({type: 'success', text: editingId != null ? 'Pair updated.' : 'Pair added.'})
    setForm({base_currency: '', quote_currency: ''})
    setEditingId(null)
    fetchPairs(selectedExchangeId)
  }

  const handleEdit = (p: PairItem) => {
    setEditingId(p.id)
    setForm({
      base_currency: p.base_currency,
      quote_currency: p.quote_currency,
    })
    setMessage(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setForm({base_currency: '', quote_currency: ''})
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this pair?')) return
    setSubmitting(true)
    setMessage(null)
    const res = await fetch(`/api/pair?id=${id}`, {method: 'DELETE'})
    setSubmitting(false)
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setMessage({type: 'error', text: 'Failed to delete pair.'})
      return
    }
    setMessage({type: 'success', text: 'Pair deleted.'})
    if (selectedExchangeId != null) fetchPairs(selectedExchangeId)
  }

  if (loadingExchanges) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
          Pairs
        </h1>
        <p className="mt-4 text-[var(--foreground)]/80">Loading…</p>
      </div>
    )
  }

  if (exchanges.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
          Pairs
        </h1>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-[var(--foreground)]">
          <p className="font-medium">No exchanges yet</p>
          <p className="mt-1 text-sm text-[var(--foreground)]/80">
            Create at least one exchange before adding pairs.
          </p>
          <a
            href={`/${locale}/dashboard/exchanges`}
            className="mt-3 inline-block rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
          >
            Go to Exchanges
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Pairs
      </h1>

      {/* Exchange dropdown */}
      <section className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">
          Exchange
        </h2>
        <select
          value={selectedExchangeId ?? ''}
          onChange={e => setSelectedExchangeId(parseInt(e.target.value, 10))}
          className={`${inputClass} cursor-pointer max-w-xs`}
          aria-label="Select exchange"
        >
          {exchanges.map(ex => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
      </section>

      {/* Add / Edit form */}
      <section className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6">
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
          {editingId != null ? 'Edit pair' : 'Add pair'}
        </h2>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="base_currency" className={`block ${labelClass} mb-1.5`}>
              Base currency <span className="text-amber-600 dark:text-amber-400">*</span>
            </label>
            <input
              id="base_currency"
              value={form.base_currency}
              onChange={e => setForm(f => ({...f, base_currency: e.target.value}))}
              onFocus={() => {
                if (selectedExchange?.name) fetchSymbolsForExchange(selectedExchange.name)
              }}
              type="text"
              required
              placeholder={loadingSymbols ? 'Loading symbols…' : 'e.g. BTC'}
              className={inputClass}
              autoComplete="off"
              list="base_currency_list"
            />
            <datalist id="base_currency_list">
              {baseSymbols.map(s => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div>
            <label htmlFor="quote_currency" className={`block ${labelClass} mb-1.5`}>
              Quote currency <span className="text-amber-600 dark:text-amber-400">*</span>
            </label>
            {isKraken ? (
              <select
                id="quote_currency"
                value={form.quote_currency}
                onChange={e => setForm(f => ({...f, quote_currency: e.target.value}))}
                required
                disabled={loadingSymbols}
                className={`${inputClass} cursor-pointer max-w-xs`}
                aria-label="Select quote currency"
              >
                <option value="">
                  {loadingSymbols ? 'Loading…' : 'Choose quote currency'}
                </option>
                {quoteSymbols.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="quote_currency"
                value={isJupiter ? 'USD' : isBitkub ? 'THB' : form.quote_currency}
                onChange={e => setForm(f => ({...f, quote_currency: e.target.value}))}
                type="text"
                required={!isJupiter && !isBitkub}
                placeholder={isJupiter || isBitkub ? undefined : 'e.g. USDT'}
                className={inputClass}
                autoComplete="off"
                disabled={isJupiter || isBitkub}
              />
            )}
          </div>
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editingId != null ? 'Save' : 'Add pair'}
            </button>
            {editingId != null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-[var(--foreground)]/20 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Message */}
      {message && (
        <p
          className={
            message.type === 'error'
              ? 'text-sm text-amber-600 dark:text-amber-400'
              : 'text-sm text-emerald-600 dark:text-emerald-400'
          }
        >
          {message.text}
        </p>
      )}

      {/* Pairs list */}
      <section>
        <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">
          Pairs for this exchange
        </h2>
        {loadingPairs ? (
          <p className="text-[var(--foreground)]/80">Loading pairs…</p>
        ) : pairs.length === 0 ? (
          <p className="text-[var(--foreground)]/80">No pairs yet. Add one above.</p>
        ) : (
          <ul className="divide-y divide-[var(--foreground)]/10 rounded-xl border border-[var(--foreground)]/15 overflow-hidden">
            {pairs.map(p => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 bg-[var(--background)] px-4 py-3 sm:px-5 sm:py-4"
              >
                <p className="font-medium text-[var(--foreground)]">
                  {p.base_currency} / {p.quote_currency}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    disabled={submitting}
                    className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
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
