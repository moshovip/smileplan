import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export interface AuthTokenPayload extends JWTPayload {
  userId: string
  isAdmin: boolean
  email?: string
}

export const COOKIE_NAME = 'stateinik_auth'
export const JWT_TTL_SECONDS = 30 * 24 * 60 * 60 // 30 days

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set and at least 32 characters')
  }
  return new TextEncoder().encode(secret)
}

export async function signAuthToken(payload: {
  userId: string
  isAdmin: boolean
  email?: string
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${JWT_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifyAuthToken(token: string): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.userId || typeof payload.userId !== 'string') return null
    return payload as AuthTokenPayload
  } catch {
    return null
  }
}
