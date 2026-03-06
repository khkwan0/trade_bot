'use client'

import Link from 'next/link'
import {useParams} from 'next/navigation'
import {useEffect, useState} from 'react'

const INTERVAL_MS = 60_000 // 1 minute

export type UserExchangeFeed = {
  name: string
  pairSymbols: string[]
}

export type FeedData = Record<
  string,
  {data: Record<string, number> | null; error: string | null}
>

async function fetchFeed(): Promise<FeedData> {
  const res = await fetch('/api/prices/feed', {
    headers: {Accept: 'application/json'},
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as FeedData
}

function displayName(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
}

export default function MarketPriceFeed({
  userExchanges = [],
  feedData: initialFeedData = {},
}: {
  userExchanges?: UserExchangeFeed[]
  feedData?: FeedData
}) {
  const [feedData, setFeedData] = useState<FeedData>(initialFeedData)
  const params = useParams()
  const locale = (params?.locale as string) ?? 'en'

  // Columns and pairs driven by what the feed returns
  const exchangeColumns = Object.keys(feedData).map(key => ({
    key,
    displayName: displayName(key),
  }))
  const sortedPairs = Array.from(
    new Set(
      exchangeColumns.flatMap(({key}) =>
        feedData[key]?.data ? Object.keys(feedData[key].data!) : [],
      ),
    ),
  ).sort()

  const hasDataForColumn = (key: string): boolean => {
    const entry = feedData[key]
    if (entry?.error) return false
    const data = entry?.data
    return Boolean(data && Object.keys(data).length > 0)
  }

  const exchangeKeys = exchangeColumns.map(c => c.key).join(',')

  useEffect(() => {
    const tick = async () => {
      const data = await fetchFeed()
      setFeedData(data)
    }
    tick()
    const id = setInterval(tick, INTERVAL_MS)
    return () => clearInterval(id)
  }, [exchangeKeys])

  const errors = exchangeColumns.filter(c => feedData[c.key]?.error)

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
      {exchangeColumns.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--muted-foreground)]">
          Add{' '}
          <Link
            href={`/${locale}/dashboard/exchanges`}
            className="text-[var(--primary)] underline underline-offset-2 hover:no-underline">
            exchanges
          </Link>{' '}
          and pairs to see market prices.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                  <th className="pb-2 pr-4 font-medium">Pair</th>
                  {exchangeColumns.map(({key, displayName}) => (
                    <th key={key} className="pb-2 pr-4 font-medium last:pr-0">
                      {displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[var(--foreground)]">
                {/* One row: for each column with no data, show the blurb in that column */}
                {exchangeColumns.some(c => !hasDataForColumn(c.key)) && (
                  <tr className="border-b border-[var(--border)]">
                    <td className="py-2 pr-4 font-medium text-[var(--muted-foreground)]">
                      —
                    </td>
                    {exchangeColumns.map(({key}) => (
                      <td key={key} className="py-2 pr-4 last:pr-0">
                        {hasDataForColumn(key) ? (
                          '—'
                        ) : (
                          <span className="text-[var(--muted-foreground)]">
                            No pairs configured.{' '}
                            <Link
                              href={`/${locale}/dashboard/pairs`}
                              className="text-[var(--primary)] underline underline-offset-2 hover:no-underline">
                              Add pairs
                            </Link>{' '}
                            to your exchanges.
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                )}
                {sortedPairs.map(pair => (
                  <tr
                    key={pair}
                    className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2 pr-4 font-medium">{pair}</td>
                    {exchangeColumns.map(({key}) => {
                      const entry = feedData[key]
                      return (
                        <td key={key} className="py-2 pr-4 last:pr-0">
                          {entry?.error
                            ? '—'
                            : entry?.data?.[pair] != null
                              ? formatPrice(entry.data[pair])
                              : '—'}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--destructive)]">
              {errors.map(({key, displayName}) => (
                <span key={key}>
                  {displayName}: {feedData[key]?.error}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, {maximumFractionDigits: 0})
  if (n >= 1)
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  if (n > 0) return n.toFixed(6)
  return String(n)
}
