import { prisma } from '@/lib/prisma'

export interface RelatedGuide {
  slug: string
  title: string
  excerpt: string
  readingMinutes: number
  ogImage: string | null
  heroImage: string | null
  author: {
    name: string | null
    slug: string | null
  } | null
}

const GUIDE_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  readingMinutes: true,
  ogImage: true, heroImage: true,
  author: { select: { name: true, slug: true } },
} as const

type RawGuide = {
  slug: string
  title: string
  excerpt: string
  readingMinutes: number
  ogImage: string | null
  heroImage: string | null
  author: { name: string | null; slug: string | null } | null
}

function shape(g: RawGuide): RelatedGuide {
  return {
    slug: g.slug,
    title: g.title,
    excerpt: g.excerpt,
    readingMinutes: g.readingMinutes,
    ogImage: g.ogImage, heroImage: g.heroImage,
    author: g.author
      ? {
          name: g.author.name ?? null,
          slug: g.author.slug ?? null,
        }
      : null,
  }
}

/**
 * Picks "related guides" with the following priority:
 *   1. pillar → all clusters
 *   2. cluster → pillar + sibling clusters
 *   3. otherwise → overlapping topics (by number of matches)
 */
export async function getRelatedGuides(guideId: string, limit = 5): Promise<RelatedGuide[]> {
  const current = await prisma.guide.findUnique({
    where: { id: guideId },
    select: {
      id: true,
      type: true,
      pillarId: true,
      topics: { select: { topicId: true } },
    },
  })
  if (!current) return []

  if (current.type === 'pillar') {
    const clusters = await prisma.guide.findMany({
      where: {
        pillarId: current.id,
        status: 'published',
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      select: GUIDE_SELECT,
    })
    return clusters.map(shape)
  }

  if (current.pillarId) {
    const pillar = await prisma.guide.findFirst({
      where: { id: current.pillarId, status: 'published', deletedAt: null },
      select: GUIDE_SELECT,
    })
    const siblings = await prisma.guide.findMany({
      where: {
        pillarId: current.pillarId,
        id: { not: current.id },
        status: 'published',
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit - (pillar ? 1 : 0),
      select: GUIDE_SELECT,
    })
    return [...(pillar ? [shape(pillar)] : []), ...siblings.map(shape)]
  }

  const topicIds = current.topics.map((t) => t.topicId)
  if (!topicIds.length) return []

  // Take candidates that overlap and sort by match count in JS — Prisma can't
  // "count overlapping joined rows", but the overlap query is bounded by topics.
  const candidates = await prisma.guide.findMany({
    where: {
      id: { not: current.id },
      status: 'published',
      deletedAt: null,
      topics: { some: { topicId: { in: topicIds } } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit * 4,
    select: {
      ...GUIDE_SELECT,
      topics: { select: { topicId: true }, where: { topicId: { in: topicIds } } },
      updatedAt: true,
    },
  })

  return candidates
    .map((g) => ({
      g,
      overlap: g.topics.length,
      updatedAt: g.updatedAt,
    }))
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
    .slice(0, limit)
    .map(({ g }) =>
      shape({
        slug: g.slug,
        title: g.title,
        excerpt: g.excerpt,
        readingMinutes: g.readingMinutes,
        ogImage: g.ogImage, heroImage: g.heroImage,
        author: g.author,
      }),
    )
}
