import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

// Built from live DB rows, so render at request time (cached an hour) instead of
// at build — this keeps `next build` / `docker build` from needing a reachable
// database, matching the other DB-backed SEO routes (llms.txt, llms-full.txt).
export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = siteConfig.url

  const [guides, concepts, topics, authors, series] = await Promise.all([
    prisma.guide.findMany({
      where: { status: 'published', deletedAt: null },
      select: { slug: true, updatedAt: true },
    }),
    siteConfig.hasConcepts
      ? prisma.concept.findMany({
          where: { status: 'published', deletedAt: null },
          select: { slug: true, updatedAt: true },
        })
      : Promise.resolve([] as Array<{ slug: string; updatedAt: Date }>),
    prisma.topic.findMany({
      where: { guides: { some: { guide: { is: { status: 'published', deletedAt: null } } } } },
      select: { slug: true },
    }),
    prisma.author.findMany({
      where: { deletedAt: null, guides: { some: { status: 'published', deletedAt: null } } },
      select: { slug: true },
    }),
    prisma.guideSeries.findMany({
      where: { guides: { some: { status: 'published', deletedAt: null } } },
      select: { slug: true, updatedAt: true },
    }),
  ])

  const now = new Date()

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${appUrl}${routes.guides()}`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    ...(siteConfig.hasConcepts
      ? [{ url: `${appUrl}${routes.concepts()}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 }]
      : []),
    { url: `${appUrl}${routes.authors()}`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ]

  const guideUrls: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${appUrl}${routes.guide(g.slug)}`,
    lastModified: g.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const conceptUrls: MetadataRoute.Sitemap = concepts.map((c) => ({
    url: `${appUrl}${routes.concept(c.slug)}`,
    lastModified: c.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  const topicUrls: MetadataRoute.Sitemap = topics.map((t) => ({
    url: `${appUrl}${routes.topic(t.slug)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  const authorUrls: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${appUrl}${routes.author(a.slug)}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  const seriesUrls: MetadataRoute.Sitemap = series.map((s) => ({
    url: `${appUrl}${routes.series(s.slug)}`,
    lastModified: s.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticUrls, ...guideUrls, ...conceptUrls, ...topicUrls, ...authorUrls, ...seriesUrls]
}
