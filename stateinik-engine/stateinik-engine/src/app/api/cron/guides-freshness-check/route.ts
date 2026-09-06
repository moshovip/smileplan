import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/site.config'
import { notifyAdmin } from '@/lib/alerts'
import { requireCron } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

const STALE_DAYS = Number(process.env.FRESHNESS_STALE_DAYS || 90)

// Flags published content not updated/reviewed in over STALE_DAYS days.
export async function GET(req: NextRequest) {
  const unauthorized = requireCron(req)
  if (unauthorized) return unauthorized

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)

  const [staleGuides, staleConcepts] = await Promise.all([
    prisma.guide.findMany({
      where: {
        status: 'published',
        deletedAt: null,
        updatedAt: { lt: cutoff },
        OR: [{ lastReviewedAt: null }, { lastReviewedAt: { lt: cutoff } }],
      },
      select: { slug: true, title: true },
      take: 50,
    }),
    siteConfig.hasConcepts
      ? prisma.concept.findMany({
          where: {
            status: 'published',
            deletedAt: null,
            updatedAt: { lt: cutoff },
            OR: [{ lastReviewedAt: null }, { lastReviewedAt: { lt: cutoff } }],
          },
          select: { slug: true, term: true },
          take: 50,
        })
      : Promise.resolve([] as Array<{ slug: string; term: string }>),
  ])

  const total = staleGuides.length + staleConcepts.length
  if (total > 0) {
    const lines = [
      ...staleGuides.map((g) => `- guide: ${g.title}`),
      ...staleConcepts.map((c) => `- concept: ${c.term}`),
    ].join('\n')
    await notifyAdmin(
      'Stale content',
      `${total} item(s) not updated or reviewed in over ${STALE_DAYS} days:\n\n${lines}`,
    )
  }

  return NextResponse.json({ ok: true, stale: total })
}
