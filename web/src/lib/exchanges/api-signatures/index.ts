import crypto from 'node:crypto'

const BITKUB_API_BASE = 'https://api.bitkub.com'

export default {
  bitkub: async function (
    apiKey: string,
    apiSecret: string,
    method: string,
    path: string,
    body?: string,
  ): Promise<Record<string, string>> {
    const tsRes = await fetch(`${BITKUB_API_BASE}/api/v3/servertime`)
    const ts = String(await tsRes.json())
    const signPayload =
      body != null && body !== ''
        ? ts + method + path + body
        : ts + method + path
    const sign = crypto
      .createHmac('sha256', apiSecret)
      .update(signPayload)
      .digest('hex')
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-BTK-APIKEY': apiKey,
      'X-BTK-TIMESTAMP': ts,
      'X-BTK-SIGN': sign,
    }
  },
  kraken: async function (apiKey: string, apiSecret: string) {
    return null
  },
}
