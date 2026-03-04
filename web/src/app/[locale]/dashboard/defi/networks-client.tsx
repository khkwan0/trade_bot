'use client'

import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation'

export type NetworkItem = {
  network: string
  created_at: string
  updated_at: string
}

export type TokenItem = {
  network: string
  token: string
  address: string
  created_at: string
  updated_at: string
}

const inputClass =
  'rounded-lg border border-[var(--foreground)]/20 bg-[var(--background)] px-3 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--foreground)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20 w-full min-w-0'
const labelClass = 'text-sm font-medium text-[var(--foreground)]'

function getTokenUrl(network: string) {
  return `/api/network/${encodeURIComponent(network)}/token`
}

type Props = {
  locale: string
}

export function NetworksClient({locale}: Props) {
  const router = useRouter()
  const [networks, setNetworks] = useState<NetworkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [editingName, setEditingName] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null)
  const [tokens, setTokens] = useState<TokenItem[]>([])
  const [tokensLoading, setTokensLoading] = useState(false)
  const [tokensSubmitting, setTokensSubmitting] = useState(false)
  const [tokensMessage, setTokensMessage] = useState<{type: 'error' | 'success'; text: string} | null>(null)
  const [editingToken, setEditingToken] = useState<string | null>(null)
  const [tokenForm, setTokenForm] = useState({token: '', address: ''})

  const fetchNetworks = async () => {
    const res = await fetch('/api/network')
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setMessage({type: 'error', text: 'Failed to load networks.'})
      return
    }
    const data = await res.json()
    setNetworks(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/network')
      .then(res => {
        if (cancelled) return
        if (res.status === 401) {
          router.push(`/${locale}`)
          return
        }
        return res.json()
      })
      .then(data => {
        if (!cancelled && Array.isArray(data)) setNetworks(data)
      })
      .catch(() => {
        if (!cancelled) setMessage({type: 'error', text: 'Failed to load networks.'})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [locale, router])

  const setEditing = (item: NetworkItem | null) => {
    setEditingName(item?.network ?? null)
    setFormName(item?.network ?? '')
    setMessage(null)
  }

  const fetchTokens = async (network: string) => {
    const res = await fetch(getTokenUrl(network))
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      setTokensMessage({type: 'error', text: 'Failed to load tokens.'})
      return
    }
    const data = await res.json()
    setTokens(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    if (!selectedNetwork) {
      setTokens([])
      setTokensMessage(null)
      setEditingToken(null)
      setTokenForm({token: '', address: ''})
      return
    }
    let cancelled = false
    setTokensLoading(true)
    setTokensMessage(null)
    fetch(getTokenUrl(selectedNetwork))
      .then(res => {
        if (cancelled) return
        if (res.status === 401) {
          router.push(`/${locale}`)
          return
        }
        return res.json()
      })
      .then(data => {
        if (!cancelled && Array.isArray(data)) setTokens(data)
      })
      .catch(() => {
        if (!cancelled) setTokensMessage({type: 'error', text: 'Failed to load tokens.'})
      })
      .finally(() => {
        if (!cancelled) setTokensLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedNetwork, locale, router])

  const setTokenEditing = (item: TokenItem | null) => {
    setEditingToken(item?.token ?? null)
    setTokenForm({
      token: item?.token ?? '',
      address: item?.address ?? '',
    })
    setTokensMessage(null)
  }

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedNetwork) return
    setTokensMessage(null)
    const token = tokenForm.token.trim()
    const address = tokenForm.address.trim()
    if (!token || !address) {
      setTokensMessage({type: 'error', text: 'Token name and contract address are required.'})
      return
    }
    setTokensSubmitting(true)
    try {
      const baseUrl = getTokenUrl(selectedNetwork)
      if (editingToken != null) {
        const res = await fetch(baseUrl, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            currentToken: editingToken,
            token,
            address,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'update_failed'
          const text =
            err === 'token_and_address_required'
              ? 'Token name and address are required.'
              : err === 'duplicate_token'
                ? 'A token with this name already exists on this network.'
                : err === 'not_found'
                  ? 'Token not found.'
                  : 'Failed to update token.'
          setTokensMessage({type: 'error', text})
          return
        }
        setTokensMessage({type: 'success', text: 'Token updated.'})
        setTokenEditing(null)
      } else {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({token, address}),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'create_failed'
          const text =
            err === 'token_and_address_required'
              ? 'Token name and address are required.'
              : err === 'duplicate_token'
                ? 'A token with this name already exists on this network.'
                : 'Failed to add token.'
          setTokensMessage({type: 'error', text})
          return
        }
        setTokensMessage({type: 'success', text: 'Token added.'})
        setTokenForm({token: '', address: ''})
      }
      await fetchTokens(selectedNetwork)
    } finally {
      setTokensSubmitting(false)
    }
  }

  const handleTokenDelete = async (token: string) => {
    if (!selectedNetwork || !confirm('Delete this token?')) return
    setTokensMessage(null)
    const res = await fetch(
      `${getTokenUrl(selectedNetwork)}?token=${encodeURIComponent(token)}`,
      {method: 'DELETE'},
    )
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setTokensMessage({
        type: 'error',
        text: data?.error === 'not_found' ? 'Token not found.' : 'Failed to delete token.',
      })
      return
    }
    setTokensMessage({type: 'success', text: 'Token deleted.'})
    if (editingToken === token) setTokenEditing(null)
    await fetchTokens(selectedNetwork)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    const name = formName.trim()
    if (!name) {
      setMessage({type: 'error', text: 'Name is required.'})
      return
    }
    setSubmitting(true)
    try {
      if (editingName != null) {
        const res = await fetch('/api/network', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({currentName: editingName, newName: name}),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'update_failed'
          const text =
            err === 'name_required'
              ? 'Name is required.'
              : err === 'duplicate_name'
                ? 'A network with this name already exists.'
                : err === 'not_found'
                  ? 'Network not found.'
                  : 'Failed to update network. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'Network updated.'})
        setEditing(null)
      } else {
        const res = await fetch('/api/network', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({network: name}),
        })
        const data = await res.json()
        if (!res.ok) {
          const err = data?.error ?? 'create_failed'
          const text =
            err === 'name_required'
              ? 'Name is required.'
              : err === 'duplicate_name'
                ? 'A network with this name already exists.'
                : 'Failed to add network. Please try again.'
          setMessage({type: 'error', text})
          return
        }
        setMessage({type: 'success', text: 'Network added.'})
        setFormName('')
      }
      await fetchNetworks()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (name: string) => {
    if (!confirm('Delete this network?')) return
    setMessage(null)
    const res = await fetch(`/api/network?name=${encodeURIComponent(name)}`, {method: 'DELETE'})
    if (res.status === 401) {
      router.push(`/${locale}`)
      return
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setMessage({
        type: 'error',
        text: data?.error === 'not_found' ? 'Network not found.' : 'Failed to delete network.',
      })
      return
    }
    setMessage({type: 'success', text: 'Network deleted.'})
    if (editingName === name) setEditing(null)
    await fetchNetworks()
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
        Networks
      </h1>

      <div
        className={`grid gap-6 ${selectedNetwork ? 'grid-cols-1 lg:grid-cols-2' : ''}`}
      >
        <div className="min-w-0 space-y-6">
          <section className="rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6">
            <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
              {editingName != null ? 'Edit network' : 'Add network'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="network-name" className={`block ${labelClass} mb-1.5`}>
                  Name <span className="text-amber-600 dark:text-amber-400">*</span>
                </label>
                <input
                  id="network-name"
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Ethereum Mainnet"
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50"
                >
                  {editingName != null ? 'Save' : 'Add network'}
                </button>
                {editingName != null && (
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
              Your networks
            </h2>
            {loading ? (
              <p className="text-[var(--foreground)]/80">Loading…</p>
            ) : networks.length === 0 ? (
              <p className="text-[var(--foreground)]/80">
                No networks yet. Add one above.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--foreground)]/10 rounded-xl border border-[var(--foreground)]/15 overflow-hidden">
                {networks.map(item => (
                  <li
                    key={item.network}
                    className="flex flex-wrap items-center justify-between gap-3 bg-[var(--background)] px-4 py-3 sm:px-5 sm:py-4"
                  >
                    <p className="font-medium text-[var(--foreground)] truncate min-w-0">
                      {item.network}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedNetwork(
                            selectedNetwork === item.network ? null : item.network,
                          )
                        }
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--background)] ${
                          selectedNetwork === item.network
                            ? 'border-[var(--foreground)]/40 bg-[var(--foreground)]/10 text-[var(--foreground)]'
                            : 'border-[var(--foreground)]/20 text-[var(--foreground)] hover:bg-[var(--foreground)]/5 focus:ring-[var(--foreground)]/20'
                        }`}
                      >
                        Tokens
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(item)}
                        className="rounded-lg border border-[var(--foreground)]/20 px-3 py-1.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.network)}
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

        {selectedNetwork && (
          <div className="min-w-0 rounded-xl border border-[var(--foreground)]/15 bg-[var(--background)] p-4 sm:p-6 self-start sticky top-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-medium text-[var(--foreground)] truncate">
                Tokens — {selectedNetwork}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedNetwork(null)}
                className="shrink-0 rounded-lg border border-[var(--foreground)]/20 px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
                aria-label="Close tokens panel"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleTokenSubmit} className="space-y-4 mb-4">
              <div>
                <label htmlFor="token-name" className={`block ${labelClass} mb-1.5`}>
                  Token name <span className="text-amber-600 dark:text-amber-400">*</span>
                </label>
                <input
                  id="token-name"
                  type="text"
                  required
                  value={tokenForm.token}
                  onChange={e => setTokenForm(f => ({...f, token: e.target.value}))}
                  placeholder="e.g. USDT"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="token-address" className={`block ${labelClass} mb-1.5`}>
                  Contract address <span className="text-amber-600 dark:text-amber-400">*</span>
                </label>
                <input
                  id="token-address"
                  type="text"
                  required
                  value={tokenForm.address}
                  onChange={e => setTokenForm(f => ({...f, address: e.target.value}))}
                  placeholder="0x..."
                  className={inputClass}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={tokensSubmitting}
                  className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] disabled:opacity-50"
                >
                  {editingToken != null ? 'Save' : 'Add token'}
                </button>
                {editingToken != null && (
                  <button
                    type="button"
                    onClick={() => setTokenEditing(null)}
                    className="rounded-lg border border-[var(--foreground)]/20 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {tokensMessage && (
              <p
                className={`text-sm mb-3 ${
                  tokensMessage.type === 'error'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {tokensMessage.text}
              </p>
            )}
            {tokensLoading ? (
              <p className="text-[var(--foreground)]/80">Loading tokens…</p>
            ) : tokens.length === 0 ? (
              <p className="text-[var(--foreground)]/80">
                No tokens for this network. Add one above.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--foreground)]/10 rounded-lg border border-[var(--foreground)]/15 overflow-hidden">
                {tokens.map(t => (
                  <li
                    key={t.token}
                    className="flex flex-wrap items-center justify-between gap-2 bg-[var(--background)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--foreground)] truncate text-sm">
                        {t.token}
                      </p>
                      <p className="text-xs text-[var(--foreground)]/60 truncate font-mono">
                        {t.address}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setTokenEditing(t)}
                        className="rounded border border-[var(--foreground)]/20 px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--foreground)]/5"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTokenDelete(t.token)}
                        className="rounded border border-red-500/40 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
