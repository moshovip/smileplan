// Auth facade. Every admin page and API route imports from here, so the rest of
// the app is decoupled from HOW auth works. The default driver is "single-admin"
// (one operator defined by ADMIN_EMAIL/ADMIN_PASSWORD, identity carried in a
// signed JWT cookie). To support multiple users, implement these same signatures
// against NextAuth or your own provider and the rest of the app is unchanged.

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  verifyAuthToken,
  signAuthToken,
  COOKIE_NAME,
  JWT_TTL_SECONDS,
  type AuthTokenPayload,
} from './jwt'

export type { AuthTokenPayload }
export { signAuthToken, COOKIE_NAME, JWT_TTL_SECONDS }

export interface CurrentUser {
  id: string
  email: string | null
  firstName: string | null
  lastName: string | null
  isAdmin: boolean
  avatarUrl: string | null
}

/** Current user for Server Components. Synthesised from the signed cookie. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  const payload = await verifyAuthToken(token)
  if (!payload) return null
  return {
    id: payload.userId,
    email: payload.email ?? null,
    firstName: null,
    lastName: null,
    isAdmin: !!payload.isAdmin,
    avatarUrl: null,
  }
}

/** Raw JWT payload for API handlers. */
export async function getAuthPayload(): Promise<AuthTokenPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyAuthToken(token)
}

/** Admin check for Server Components. */
export async function verifyAdminAccess(): Promise<{ userId: string } | null> {
  const payload = await getAuthPayload()
  if (!payload?.isAdmin) return null
  return { userId: payload.userId }
}

/** CSRF + admin wrapper for state-changing admin API routes. */
export async function verifyAdminApi(
  req: NextRequest,
): Promise<NextResponse | { userId: string }> {
  const { checkOrigin } = await import('./csrf')
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const admin = await verifyAdminAccess()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return admin
}

/** CSRF + authenticated wrapper for non-admin API routes. */
export async function verifyUserApi(
  req: NextRequest,
): Promise<NextResponse | AuthTokenPayload> {
  const { checkOrigin } = await import('./csrf')
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const payload = await getAuthPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return payload
}

/** Cookie options shared by the login/logout routes. */
export function authCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}
