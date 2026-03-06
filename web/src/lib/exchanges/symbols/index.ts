export type SymbolEntry = {base: string; quote: string}

export type SymbolResult = {
  bases: string[]
  quotes: string[]
  pairs: SymbolEntry[]
}

const BINANCE_URL = 'https://api.binance.com/api/v3/exchangeInfo'
const BITKUB_URL = 'https://api.bitkub.com/api/v3/market/symbols'
const KRAKEN_URL = 'https://api.kraken.com/0/public/AssetPairs'
const JUPITER_URL = 'https://api.jupiter.com/v1/symbols'

function normalizeBinance(
  data: {symbols?: Array<{baseAsset?: string; quoteAsset?: string}>},
): SymbolEntry[] {
  const list = data.symbols ?? []
  return list
    .filter(
      (s): s is {baseAsset: string; quoteAsset: string} =>
        Boolean(s.baseAsset && s.quoteAsset),
    )
    .map(s => ({base: s.baseAsset, quote: s.quoteAsset}))
}

function normalizeBitkub(data: {
  result?: Array<{base_asset?: string; quote_asset?: string}>;
}): SymbolEntry[] {
  const list = data.result ?? []
  return list
    .filter(
      (s): s is {base_asset: string; quote_asset: string} =>
        Boolean(s.base_asset && s.quote_asset),
    )
    .map(s => ({base: s.base_asset, quote: s.quote_asset}))
}

function normalizeKraken(data: {
  result?: Record<string, {base?: string; quote?: string}>;
}): SymbolEntry[] {
  const result = data.result ?? {}
  return Object.values(result)
    .filter(
      (s): s is {base: string; quote: string} => Boolean(s?.base && s?.quote),
    )
    .map(s => ({base: s.base, quote: s.quote}))
}

function normalizeJupiter(data: unknown): SymbolEntry[] {
  if (!Array.isArray(data)) return []
  return data
    .filter(
      (s): s is {base: string; quote: string} =>
        s != null &&
        typeof s === 'object' &&
        'base' in s &&
        'quote' in s &&
        typeof (s as {base: unknown}).base === 'string' &&
        typeof (s as {quote: unknown}).quote === 'string',
    )
    .map(s => ({base: s.base, quote: s.quote}))
}

const config: Record<
  string,
  {url: string; normalize: (data: unknown) => SymbolEntry[]}
> = {
  binance: {url: BINANCE_URL, normalize: d => normalizeBinance(d as Parameters<typeof normalizeBinance>[0])},
  bitkub: {url: BITKUB_URL, normalize: d => normalizeBitkub(d as Parameters<typeof normalizeBitkub>[0])},
  kraken: {url: KRAKEN_URL, normalize: d => normalizeKraken(d as Parameters<typeof normalizeKraken>[0])},
  jupiter: {url: JUPITER_URL, normalize: normalizeJupiter},
}

export async function getSymbols(exchange: string): Promise<SymbolResult> {
  const key = exchange.toLowerCase()
  const entry = config[key]
  if (!entry) {
    throw new Error('Unknown exchange')
  }
  const res = await fetch(entry.url, {headers: {Accept: 'application/json'}})
  if (!res.ok) {
    throw new Error('Failed to fetch symbols')
  }
  const data: unknown = await res.json()
  const pairs = entry.normalize(data)
  const bases = [...new Set(pairs.map(s => s.base))].sort()
  const quotes = [...new Set(pairs.map(s => s.quote))].sort()
  return {bases, quotes, pairs}
}
