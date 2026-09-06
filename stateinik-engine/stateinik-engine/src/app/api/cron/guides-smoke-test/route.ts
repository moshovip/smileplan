import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'
import { notifyAdmin } from '@/lib/alerts'
import { requireCron } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 10_000

interface SmokeFailure {
  slug: string
  status: number | string
}

// Fetches a few random published guide URLs and alerts if any don't return 200.
export async function GET(req: NextRequest) {
  const unauthorized = requireCron(req)
  if (unauthorized) return unauthorized

  // Random sample so we don't test the same pages every run.
  const guides = await prisma.$queryRaw<Array<{ slug: string }>>`
    SELECT "slug" FROM "Guide"
    WHERE "status" = 'published' AND "deletedAt" IS NULL
    ORDER BY random()
    LIMIT 3
  `
  if (guides.length === 0) {
    return NextResponse.json({ ok: true, tested: 0, failed: [], note: 'no published guides' })
  }

  const failed: SmokeFailure[] = []

  for (const g of guides) {
    const url = `${siteConfig.url}${routes.guide(g.slug)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'stateinik-smoke-test' } })
      if (res.status !== 200) failed.push({ slug: g.slug, status: res.status })
    } catch (err) {
      failed.push({ slug: g.slug, status: err instanceof Error ? err.name : 'error' })
    } finally {
      clearTimeout(timer)
    }
  }

  if (failed.length > 0) {
    const lines = failed.map((f) => `- /${f.slug} → ${f.status}`).join('\n')
    await notifyAdmin('Smoke test failed', `${failed.length} of ${guides.length} guide page(s) failed:\n\n${lines}`)
  }

  return NextResponse.json({ ok: failed.length === 0, tested: guides.length, failed })
}
