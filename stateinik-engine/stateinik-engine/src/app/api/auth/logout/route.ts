import { NextRequest, NextResponse } from 'next/server'
import { checkOrigin } from '@/lib/csrf'
import { COOKIE_NAME, authCookieOptions } from '@/lib/auth-helpers'

export async function POST(req: NextRequest) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, '', authCookieOptions(0))
  return res
}
