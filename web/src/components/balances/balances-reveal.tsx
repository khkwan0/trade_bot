'use client'

import {useState} from 'react'
import type {Balance} from '@/types/exchange-info'

type Props = {
  entries: Array<[string, Record<string, Balance>]>
}

function formatBalance(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })
}

function EyeIcon({className}: {className?: string}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({className}: {className?: string}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  )
}

export function BalancesReveal({entries}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h2 className="text-lg font-medium text-[var(--foreground)]">
          Balances
        </h2>
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--foreground)] bg-[var(--muted)] hover:bg-[var(--muted)]/80 border border-[var(--border)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          aria-expanded={visible}
          aria-label={visible ? 'Hide balances' : 'Show balances'}
        >
          {visible ? (
            <>
              <EyeOffIcon />
              <span>Hide</span>
            </>
          ) : (
            <>
              <EyeIcon />
              <span>Show</span>
            </>
          )}
        </button>
      </div>

      {visible ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {entries.map(([exchangeName, balances]) => {
            const tokenEntries = Object.entries(balances)
            if (tokenEntries.length === 0) return null
            return (
              <div
                key={exchangeName}
                className="rounded-lg border border-[var(--border)] overflow-hidden"
              >
                <div className="px-4 py-2 bg-[var(--muted)] font-medium text-[var(--foreground)] capitalize">
                  {exchangeName}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border)]">
                        <th className="text-left px-4 py-2 font-medium text-[var(--muted-foreground)]">
                          Token
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">
                          Available
                        </th>
                        <th className="text-right px-4 py-2 font-medium text-[var(--muted-foreground)]">
                          Reserved
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenEntries.map(([token, balance]) => (
                        <tr
                          key={token}
                          className="border-b border-[var(--border)] last:border-0"
                        >
                          <td className="px-4 py-2 font-medium text-[var(--foreground)]">
                            {token.toUpperCase()}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">
                            {formatBalance(balance.available)}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-[var(--foreground)]">
                            {formatBalance(balance.reserved)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div
          className="rounded-lg border border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--muted-foreground)]"
          aria-hidden
        >
          Click Show to reveal your balances
        </div>
      )}
    </section>
  )
}
