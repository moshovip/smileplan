import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'
import { pingIndexNow } from '@/lib/seo/indexnow'
import { notifyAdmin } from '@/lib/alerts'
import { requireCron } from '@/lib/cron-auth'

export const dynamic = 'force-dynamic'

// Publishes guides (and concepts) whose scheduledPublishAt is due.
export async function GET(req: NextRequest) {
  const unauthorized = requireCron(req)
  if (unauthorized) return unauthorized

  const now = new Date()

  const [guides, concepts] = await Promise.all([
    prisma.guide.findMany({
      where: { status: 'scheduled', scheduledPublishAt: { lte: now }, deletedAt: null },
      select: { id: true, slug: true, title: true, publishedAt: true },
    }),
    siteConfig.hasConcepts
      ? prisma.concept.findMany({
          where: { status: 'scheduled', scheduledPublishAt: { lte: now }, deletedAt: null },
          select: { id: true, slug: true, term: true, publishedAt: true },
        })
      : Promise.resolve([] as Array<{ id: string; slug: string; term: string; publishedAt: Date | null }>),
  ])

  const indexNowUrls: string[] = []
  const lines: string[] = []

  for (const g of guides) {
    await prisma.guide.update({
      where: { id: g.id },
      data: { status: 'published', publishedAt: g.publishedAt ?? now },
    })
    revalidatePath(routes.guide(g.slug))
    revalidatePath(routes.guides())
    indexNowUrls.push(`${siteConfig.url}${routes.guide(g.slug)}`)
    lines.push(`- ${g.title}`)
  }

  for (const c of concepts) {
    await prisma.concept.update({
      where: { id: c.id },
      data: { status: 'published', publishedAt: c.publishedAt ?? now },
    })
    revalidatePath(routes.concept(c.slug))
    indexNowUrls.push(`${siteConfig.url}${routes.concept(c.slug)}`)
    lines.push(`- ${c.term}`)
  }

  const total = guides.length + concepts.length
  if (indexNowUrls.length) {
    void pingIndexNow(indexNowUrls).catch((err) => console.error('[publish-scheduled] IndexNow:', err))
  }
  if (total > 0) {
    await notifyAdmin('Scheduled content published', `Published ${total} item(s):\n\n${lines.join('\n')}`)
  }

  return NextResponse.json({ ok: true, published: total })
}
