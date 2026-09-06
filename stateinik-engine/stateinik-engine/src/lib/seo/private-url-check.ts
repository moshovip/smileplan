/**
 * SSRF guard for crons that fetch external URLs from user-generated content
 * (broken-link-check, image-check). Blocks private/internal IP ranges so an
 * author can't use a link in MDX to reach cloud metadata endpoints or internal
 * services (databases, admin panels, etc.) from inside the instance.
 *
 * Used BEFORE the fetch. Also blocks protocols other than http(s).
 */

const PRIVATE_HOST_PATTERNS: RegExp[] = [
  /^localhost$/i,
  /^127\./,                                   // 127.0.0.0/8
  /^10\./,                                    // 10.0.0.0/8
  /^192\.168\./,                              // 192.168.0.0/16
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,           // 172.16.0.0/12
  /^169\.254\./,                              // link-local (AWS/Yandex Cloud metadata)
  /^0\./,                                     // 0.0.0.0/8
  /^::1$/,                                    // IPv6 loopback
  /^fc/i,                                     // IPv6 unique local (fc00::/7)
  /^fe80:/i,                                  // IPv6 link-local
]

const PRIVATE_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.yandex.internal',
])

export interface UrlCheckReason {
  ok: boolean
  reason?: string
}

/**
 * Checks whether a URL is safe to fetch from outside (cron / admin tool).
 * Does no DNS resolution — a compromise for simplicity and resilience against
 * DNS rebinding. If you want more protection, add a lookup before the fetch AND
 * a re-check after redirects.
 */
export function checkExternalUrl(url: string): UrlCheckReason {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: `protocol ${parsed.protocol} not allowed` }
  }

  const host = parsed.hostname.toLowerCase()

  if (PRIVATE_HOSTNAMES.has(host)) {
    return { ok: false, reason: `hostname ${host} is private` }
  }
  for (const re of PRIVATE_HOST_PATTERNS) {
    if (re.test(host)) {
      return { ok: false, reason: `host ${host} matches private range ${re}` }
    }
  }
  // A bare IP in a local subnet is blocked (in case someone links to
  // `http://192.168.1.10:8080/...` directly without a hostname).
  // Also blocks IPv6 in square brackets like [::1].
  if (host.startsWith('[') && host.endsWith(']')) {
    const inner = host.slice(1, -1)
    if (inner === '::1' || inner.startsWith('fc') || inner.startsWith('fe80:')) {
      return { ok: false, reason: `IPv6 ${inner} is private` }
    }
  }

  return { ok: true }
}

export function isExternalUrlAllowed(url: string): boolean {
  return checkExternalUrl(url).ok
}
