/**
 * Fonts for the @vercel/og ImageResponse.
 *
 * Without an embedded font, OG image titles render in satori's built-in
 * default, which doesn't match the site's brand. We load Plus Jakarta Sans
 * (the brand font, weights 400 + 700) from the jsdelivr-hosted fontsource
 * package once on the module's cold start, then serve it from memory.
 *
 * Format note: satori (the engine behind @vercel/og) accepts ttf, otf and
 * woff — but NOT woff2 — so we load the .woff files fontsource ships. The
 * "latin" subset covers the default content; if your titles use another
 * script, add a face that covers it here (Plus Jakarta Sans has no Cyrillic
 * glyphs, for example).
 */

const FONT_VERSION = '5.1.1'
const FONT_BASE = `https://cdn.jsdelivr.net/npm/@fontsource/plus-jakarta-sans@${FONT_VERSION}/files`

const FONT_URLS = {
  jakartaRegular: `${FONT_BASE}/plus-jakarta-sans-latin-400-normal.woff`,
  jakartaBold: `${FONT_BASE}/plus-jakarta-sans-latin-700-normal.woff`,
}

export interface OgFont {
  name: string
  data: ArrayBuffer
  weight: 400 | 700
  style: 'normal'
}

let cache: OgFont[] | null = null
let inflight: Promise<OgFont[]> | null = null

async function fetchFont(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Font fetch failed (${res.status}): ${url}`)
  }
  return res.arrayBuffer()
}

/**
 * Returns the array for `new ImageResponse(..., { fonts: ... })`.
 * If the fetch fails (jsdelivr down, network) it returns [], and ImageResponse
 * falls back to the default fonts (ugly for Cyrillic, but the image still
 * gets generated). We log the error so it gets noticed.
 */
export async function loadOgFonts(): Promise<OgFont[]> {
  if (cache) return cache
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const [regular, bold] = await Promise.all([
        fetchFont(FONT_URLS.jakartaRegular),
        fetchFont(FONT_URLS.jakartaBold),
      ])
      cache = [
        { name: 'Plus Jakarta Sans', data: regular, weight: 400, style: 'normal' },
        { name: 'Plus Jakarta Sans', data: bold, weight: 700, style: 'normal' },
      ]
      return cache
    } catch (err) {
      console.error('[og/fonts] failed to load Plus Jakarta Sans, falling back:', err)
      // Cache an empty array briefly so we don't hit the failing CDN
      // on every request.
      cache = []
      // After 60s, allow a retry (in case it was a transient error).
      setTimeout(() => {
        if (cache && cache.length === 0) cache = null
      }, 60_000)
      return cache
    } finally {
      inflight = null
    }
  })()

  return inflight
}
