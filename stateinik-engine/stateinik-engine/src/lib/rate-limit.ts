import { RateLimiterRedis, RateLimiterMemory, RateLimiterAbstract } from 'rate-limiter-flexible'
import { redis } from './redis'

const limiters = new Map<string, RateLimiterAbstract>()

// Rate limiter backed by Redis when available, else in-memory.
export function getRateLimiter(
  keyPrefix: string,
  points: number,
  durationSeconds: number,
): RateLimiterAbstract {
  const key = `${keyPrefix}:${points}:${durationSeconds}`
  const cached = limiters.get(key)
  if (cached) return cached

  const limiter: RateLimiterAbstract = redis
    ? new RateLimiterRedis({
        storeClient: redis,
        keyPrefix,
        points,
        duration: durationSeconds,
        insuranceLimiter: new RateLimiterMemory({ keyPrefix: `${keyPrefix}_fallback`, points, duration: durationSeconds }),
      })
    : new RateLimiterMemory({ keyPrefix, points, duration: durationSeconds })

  limiters.set(key, limiter)
  return limiter
}

export async function checkRateLimit(
  ip: string,
  keyPrefix: string,
  points: number,
  durationSeconds: number,
): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const limiter = getRateLimiter(keyPrefix, points, durationSeconds)
  try {
    await limiter.consume(ip)
    return { allowed: true }
  } catch (rateLimiterRes) {
    const res = rateLimiterRes as { msBeforeNext?: number }
    return { allowed: false, retryAfterMs: res.msBeforeNext }
  }
}

// Client IP from proxy headers. x-real-ip (set by the reverse proxy) is trusted
// first; for x-forwarded-for we take the last hop (closest trusted proxy).
// IMPORTANT: these headers are only trustworthy behind a reverse proxy that sets
// them. If the app port is exposed directly to clients, set TRUST_PROXY=false so a
// client can't spoof x-real-ip to mint a fresh rate-limit bucket per request
// (it then shares one coarse bucket instead).
export function getClientIp(request: Request): string {
  if (process.env.TRUST_PROXY === 'false') return 'no-proxy'
  const headers = request.headers
  const realIp = headers.get('x-real-ip')
  if (realIp) return realIp
  const xff = headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map((s) => s.trim()).filter(Boolean)
    return parts[parts.length - 1] || '127.0.0.1'
  }
  return '127.0.0.1'
}
