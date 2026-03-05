'use client'

import { useEffect, useState } from 'react'

const INTERVAL_MS = 60_000 // 1 minute

const ENDPOINTS = {
  bitkub: 'https://api.bitkub.com/api/v3/market/ticker',
  kraken: 'https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD',
  jupiter: 'https://api.jupiter.com/v1/prices?symbols=SOL_USDC,BTC_USDC',
} as const

type ExchangeName = keyof typeof ENDPOINTS

type FeedState = {
  [K in ExchangeName]: {
    data: Record<string, number> | null
    error: string | null
    loading: boolean
  }
}

const initialFeedState: FeedState = {
  bitkub: { data: null, error: null, loading: true },
  kraken: { data: null, error: null, loading: true },
  jupiter: { data: null, error: null, loading: true },
}

function parseBitkub(json: unknown): Record<string, number> | null {
  if (!Array.isArray(json)) return null
  const out: Record<string, number> = {}
  for (const item of json) {
    if (item && typeof item === 'object' && 'symbol' in item && 'last' in item) {
      const symbol = String((item as { symbol: string }).symbol)
      const last = Number((item as { last: string }).last)
      if (symbol && !Number.isNaN(last)) out[symbol] = last
    }
  }
  return Object.keys(out).length ? out : null
}

function parseKraken(json: unknown): Record<string, number> | null {
  if (!json || typeof json !== 'object' || !('result' in json)) return null
  const result = (json as { result: Record<string, { c?: string[] }> }).result
  if (!result || typeof result !== 'object') return null
  const pairToNormal: Record<string, string> = {
    XXBTZUSD: 'BTC_USD',
    XETHZUSD: 'ETH_USD',
  }
  const out: Record<string, number> = {}
  for (const [pair, ticker] of Object.entries(result)) {
    const normal = pairToNormal[pair] ?? pair
    const c = ticker?.c
    if (Array.isArray(c) && c[0] != null) {
      const price = Number(c[0])
      if (!Number.isNaN(price)) out[normal] = price
    }
  }
  return Object.keys(out).length ? out : null
}

function parseJupiter(json: unknown): Record<string, number> | null {
  if (!json || typeof json !== 'object') return null
  const out: Record<string, number> = {}
  for (const [symbol, value] of Object.entries(json)) {
    if (value != null && typeof value === 'object' && 'price' in value) {
      const p = Number((value as { price: number }).price)
      if (!Number.isNaN(p)) out[symbol] = p
    } else if (typeof value === 'number' && !Number.isNaN(value)) {
      out[symbol] = value
    }
  }
  return Object.keys(out).length ? out : null
}

const parsers: Record<ExchangeName, (json: unknown) => Record<string, number> | null> = {
  bitkub: parseBitkub,
  kraken: parseKraken,
  jupiter: parseJupiter,
}

async function fetchFeed(
  name: ExchangeName,
): Promise<{ data: Record<string, number> | null; error: string | null }> {
  const url = ENDPOINTS[name]
  const parse = parsers[name]
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { data: null, error: `HTTP ${res.status}` }
    const json: unknown = await res.json()
    const data = parse(json)
    return { data, error: data ? null : 'Parse failed' }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { data: null, error: message }
  }
}

export default function MarketPriceFeed() {
  const [feed, setFeed] = useState<FeedState>(initialFeedState)

  const runAll = () => {
    setFeed((prev) => ({
      bitkub: { ...prev.bitkub, loading: true, error: null },
      kraken: { ...prev.kraken, loading: true, error: null },
      jupiter: { ...prev.jupiter, loading: true, error: null },
    }))
    const names: ExchangeName[] = ['bitkub', 'kraken', 'jupiter']
    names.forEach((name) => {
      fetchFeed(name).then(({ data, error }) => {
        setFeed((prev) => ({
          ...prev,
          [name]: { data, error, loading: false },
        }))
      })
    })
  }

  useEffect(() => {
    runAll()
    const id = setInterval(runAll, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  const pairs = new Set<string>()
  Object.values(feed).forEach(({ data }) => {
    if (data) Object.keys(data).forEach((p) => pairs.add(p))
  })
  const sortedPairs = Array.from(pairs).sort()

  return (
    <section className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-medium text-[var(--foreground)]">
          Market price feed
        </h2>
        <span className="text-xs text-[var(--muted-foreground)]">
          Refreshes every 1 min
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
              <th className="pb-2 pr-4 font-medium">Pair</th>
              <th className="pb-2 pr-4 font-medium">Bitkub</th>
              <th className="pb-2 pr-4 font-medium">Kraken</th>
              <th className="pb-2 font-medium">Jupiter</th>
            </tr>
          </thead>
          <tbody className="text-[var(--foreground)]">
            {sortedPairs.length === 0 &&
            !feed.bitkub.loading &&
            !feed.kraken.loading &&
            !feed.jupiter.loading ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-[var(--muted-foreground)]">
                  No prices loaded. Check errors below.
                </td>
              </tr>
            ) : (
              sortedPairs.slice(0, 12).map((pair) => (
                <tr
                  key={pair}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="py-2 pr-4 font-medium">{pair}</td>
                  <td className="py-2 pr-4">
                    {feed.bitkub.loading
                      ? '…'
                      : feed.bitkub.error
                        ? '—'
                        : feed.bitkub.data?.[pair] != null
                          ? formatPrice(feed.bitkub.data[pair])
                          : '—'}
                  </td>
                  <td className="py-2 pr-4">
                    {feed.kraken.loading
                      ? '…'
                      : feed.kraken.error
                        ? '—'
                        : feed.kraken.data?.[pair] != null
                          ? formatPrice(feed.kraken.data[pair])
                          : '—'}
                  </td>
                  <td className="py-2">
                    {feed.jupiter.loading
                      ? '…'
                      : feed.jupiter.error
                        ? '—'
                        : feed.jupiter.data?.[pair] != null
                          ? formatPrice(feed.jupiter.data[pair])
                          : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {(feed.bitkub.error || feed.kraken.error || feed.jupiter.error) && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--destructive)]">
          {feed.bitkub.error && <span>Bitkub: {feed.bitkub.error}</span>}
          {feed.kraken.error && <span>Kraken: {feed.kraken.error}</span>}
          {feed.jupiter.error && <span>Jupiter: {feed.jupiter.error}</span>}
        </div>
      )}
    </section>
  )
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (n >= 1) return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  if (n > 0) return n.toFixed(6)
  return String(n)
}
