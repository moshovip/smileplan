/**
 * Determines whether a link points to an external (third-party) domain.
 *
 * Internal links are: relative paths (`/...`, `#...`, `?...`),
 * mailto/tel/sms, and any links to the site's own host (including subdomains).
 * Everything else (http/https to a different host) is external: we open
 * such links in a new tab with rel="noopener noreferrer".
 */
import { siteConfig } from '@/site.config'

const SITE_HOST = new URL(siteConfig.url).host

export function isExternalUrl(href: string | undefined | null): boolean {
  if (!href) return false
  const h = href.trim()
  if (!h) return false
  // relative / anchors / query-only
  if (h.startsWith('/') || h.startsWith('#') || h.startsWith('?')) return false
  // special schemes — not external tabs
  if (/^(mailto:|tel:|sms:)/i.test(h)) return false

  try {
    const url = new URL(h, `https://${SITE_HOST}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return host !== SITE_HOST && !host.endsWith(`.${SITE_HOST}`)
  } catch {
    return false
  }
}
