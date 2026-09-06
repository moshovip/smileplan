import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { extractMdxMeta } from '@/lib/mdx/extract'
import { checkExternalUrl } from '@/lib/seo/private-url-check'
import { notifyAdmin } from '@/lib/alerts'
import { requireCron } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const FETCH_TIMEOUT_MS = 10_000
const MAX_LINKS_PER_GUIDE = 40
const MAX_REDIRECTS = 5

// Follows redirects MANUALLY, re-running the SSRF gate on every hop's Location.
// `redirect: 'follow'` would let an attacker-controlled public host 302 us to an
// internal/metadata address (169.254.169.254, localhost, RFC-1918) — so we never
// auto-follow. (Note: checkExternalUrl is string-only; a hostname that resolves to
// a private IP via DNS rebinding is still a residual risk for hostile networks.)
async function isBroken(url: string): Promise<{ broken: boolean; status?: number; error?: string }> {
  let current = url
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!checkExternalUrl(current).ok) return { broken: false } // unsafe target: don't report, don't fetch
      let res = await fetch(current, { method: 'HEAD', redirect: 'manual', signal: controller.signal })
      if (res.status === 405 || res.status === 501) {
        res = await fetch(current, { method: 'GET', redirect: 'manual', signal: controller.signal })
      }
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location')
        if (!loc) return { broken: true, status: res.status }
        current = new URL(loc, current).toString()
        continue
      }
      return res.status >= 400 ? { broken: true, status: res.status } : { broken: false }
    }
    return { broken: true, error: 'too many redirects' }
  } catch (err) {
    return { broken: true, error: err instanceof Error ? err.name : 'error' }
  } finally {
    clearTimeout(timer)
  }
}

export async function GET(req: NextRequest) {
  const unauthorized = requireCron(req)
  if (unauthorized) return unauthorized

  const guides = await prisma.guide.findMany({
    where: { status: 'published', deletedAt: null },
    select: { id: true, slug: true, title: true, content: true },
  })

  const brokenByGuide: Array<{ title: string; count: number }> = []
  let totalBroken = 0

  for (const g of guides) {
    const links = extractMdxMeta(g.content).externalLinks.slice(0, MAX_LINKS_PER_GUIDE)
    const broken: Array<{ url: string; statusCode: number | null; errorMessage: string | null }> = []
    for (const link of links) {
      const r = await isBroken(link.url)
      if (r.broken) broken.push({ url: link.url, statusCode: r.status ?? null, errorMessage: r.error ?? null })
    }

    await prisma.$transaction([
      prisma.guideBrokenLink.deleteMany({ where: { guideId: g.id } }),
      ...broken.map((b) =>
        prisma.guideBrokenLink.create({
          data: { guideId: g.id, url: b.url, statusCode: b.statusCode, errorMessage: b.errorMessage },
        }),
      ),
    ])

    if (broken.length > 0) {
      brokenByGuide.push({ title: g.title, count: broken.length })
      totalBroken += broken.length
    }
  }

  if (totalBroken > 0) {
    const lines = brokenByGuide.slice(0, 20).map((b) => `- ${b.title}: ${b.count}`).join('\n')
    await notifyAdmin(
      'Broken links found',
      `${totalBroken} broken link(s) across ${brokenByGuide.length} guide(s):\n\n${lines}`,
    )
  }

  return NextResponse.json({ ok: true, totalBroken, guidesWithBroken: brokenByGuide.length })
}
