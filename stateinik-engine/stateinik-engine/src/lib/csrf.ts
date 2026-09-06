import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

/**
 * Origin/Referer check for CSRF protection on state-changing requests.
 * Returns a 403 NextResponse if the origin doesn't match, or null if OK.
 */
export function checkOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')

  // Browsers always send Origin for cross-origin fetch/XHR. A missing Origin on
  // a POST is either non-browser (curl/script) or a same-origin form submit;
  // fall back to Referer.
  const effectiveOrigin =
    origin ||
    (() => {
      const referer = request.headers.get('referer')
      if (!referer) return null
      try {
        return new URL(referer).origin
      } catch {
        return null
      }
    })()

  if (!effectiveOrigin) {
    if (process.env.NODE_ENV === 'development') return null
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!APP_URL) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const host = new URL(effectiveOrigin).hostname
        if (host === 'localhost' || host === '127.0.0.1') return null
      } catch {
        /* fall through */
      }
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const originHost = new URL(effectiveOrigin).hostname
    const appHost = new URL(APP_URL).hostname
    if (originHost !== appHost) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}
