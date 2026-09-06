import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { checkOrigin } from '@/lib/csrf'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import {
  signAuthToken,
  COOKIE_NAME,
  JWT_TTL_SECONDS,
  authCookieOptions,
} from '@/lib/auth-helpers'

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

// Single-admin login: checks the request against ADMIN_EMAIL/ADMIN_PASSWORD and
// issues a signed admin cookie. For multi-user auth, replace this with your own
// provider (the rest of the app only depends on @/lib/auth-helpers).
export async function POST(req: NextRequest) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf

  // Throttle brute-force: 10 attempts/min/IP.
  const rl = await checkRateLimit(getClientIp(req), 'auth-login', 10, 60)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 500 })
  }

  const body = (await req.json().catch(() => ({}))) as { email?: unknown; password?: unknown }
  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''

  const ok =
    safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) &&
    safeEqual(password, adminPassword)
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await signAuthToken({ userId: 'admin', isAdmin: true, email: adminEmail })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, authCookieOptions(JWT_TTL_SECONDS))
  return res
}
