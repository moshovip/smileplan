import Redis from 'ioredis'

// Optional Redis. When REDIS_URL is unset, `redis` is null and every helper
// degrades gracefully (no cache, rate limiting falls back to in-memory).

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined
}

function parseRedisUrl(url: string) {
  const parsed = new URL(url)
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 6379,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    username: parsed.username && parsed.username !== 'default' ? decodeURIComponent(parsed.username) : undefined,
    db: parsed.pathname ? parseInt(parsed.pathname.slice(1), 10) || 0 : 0,
  }
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) return null
  try {
    const client = new Redis({
      ...parseRedisUrl(url),
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 10) return null
        return Math.min(times * 500, 5000)
      },
    })
    client.on('error', (err) => console.error('[Redis] Connection error:', err.message))
    return client
  } catch {
    console.error('[Redis] Failed to create client')
    return null
  }
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

export async function cacheGet(key: string): Promise<string | null> {
  if (!redis) return null
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (!redis) return
  try {
    if (ttlSeconds) await redis.set(key, value, 'EX', ttlSeconds)
    else await redis.set(key, value)
  } catch {
    /* no cache */
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(key)
  } catch {
    /* no cache */
  }
}
