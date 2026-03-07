import crypto from 'node:crypto'

const BITKUB_API_BASE = 'https://api.bitkub.com'

/** Kraken requires a strictly increasing nonce per request. Use a monotonic generator to avoid EAPI:Invalid nonce when multiple requests run in parallel. */
let lastKrakenNonce = 0
function getKrakenNonce(): string {
  const now = Date.now() * 1000
  lastKrakenNonce = Math.max(now, lastKrakenNonce + 1)
  return lastKrakenNonce.toString()
}

/**
 * Kraken API-Sign: HMAC-SHA512(URI path + SHA256(nonce + POST data), base64_decode(secret))
 * @see https://docs.kraken.com/api/docs/guides/spot-rest-auth
 */
function getKrakenSignature(
  urlPath: string,
  data: Record<string, string | number>,
  secret: string,
): string {
  const encodedPayload = new URLSearchParams(
    Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)]),
    ) as Record<string, string>,
  ).toString()
  const encoded = data.nonce + encodedPayload
  const sha256Hash = crypto.createHash('sha256').update(encoded).digest()
  const message = Buffer.concat([Buffer.from(urlPath, 'utf8'), sha256Hash])
  const secretBuffer = Buffer.from(secret, 'base64')
  const hmac = crypto.createHmac('sha512', secretBuffer)
  hmac.update(message)
  return hmac.digest('base64')
}


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
  kraken: async function (
    apiKey: string,
    apiSecret: string,
    path: string,
    postData: Record<string, string | number> = {},
  ): Promise<Record<string, string> & {body: string}> {
    const nonce = getKrakenNonce()
    const data = {nonce, ...postData}
    const encodedPayload = new URLSearchParams(
      Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)]),
      ) as Record<string, string>,
    ).toString()
    const apiSign = getKrakenSignature(path, data, apiSecret)
    return {
      'API-Key': apiKey,
      'API-Sign': apiSign,
      'Content-Type': 'application/x-www-form-urlencoded',
      body: encodedPayload,
    }
  },
}
