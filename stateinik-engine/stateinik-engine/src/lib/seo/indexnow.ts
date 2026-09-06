// IndexNow — pings the IndexNow network (Bing, Yandex, Seznam) on publish.
// Spec: https://www.indexnow.org/
//
// The actual call is made by Phase 5 (admin) on publish. This is just the base helper
// and config validation. The key lives in INDEXNOW_KEY (.env, not committed) and is
// presented to Yandex via a /<key>.txt file in public/ — that's the self-verification.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export interface IndexNowResult {
  ok: boolean
  status: number
  skipped?: boolean
  reason?: string
}

function getKey(): string | null {
  const key = process.env.INDEXNOW_KEY
  if (!key || key.length < 8) return null
  return key
}

function getHost(): string {
  return new URL(APP_URL).host
}

export function indexNowReady(): boolean {
  return getKey() !== null
}

export async function pingIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = getKey()
  if (!key) {
    return {
      ok: false,
      status: 0,
      skipped: true,
      reason: 'INDEXNOW_KEY is not configured',
    }
  }
  if (urls.length === 0) {
    return { ok: true, status: 0, skipped: true, reason: 'no urls' }
  }

  const host = getHost()
  const body = {
    host,
    key,
    keyLocation: `${APP_URL}/${key}.txt`,
    urlList: urls,
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    })
    return { ok: res.ok, status: res.status }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      reason: err instanceof Error ? err.message : String(err),
    }
  }
}
