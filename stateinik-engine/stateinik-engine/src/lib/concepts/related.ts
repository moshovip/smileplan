import { prisma } from '@/lib/prisma'
import type { RelatedGuide } from '@/lib/guides/related'

export interface RelatedConcept {
  slug: string
  term: string
  shortDefinition: string
}

export async function getRelatedConcepts(conceptId: string, limit = 5): Promise<RelatedConcept[]> {
  const current = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: {
      id: true,
      topics: { select: { topicId: true } },
      relatedConcepts: {
        where: { status: 'published', deletedAt: null },
        select: { id: true, slug: true, term: true, shortDefinition: true, updatedAt: true },
      },
    },
  })
  if (!current) return []

  const seen = new Set<string>()
  const out: RelatedConcept[] = []

  for (const r of current.relatedConcepts
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())) {
    if (out.length >= limit) break
    seen.add(r.id)
    out.push({ slug: r.slug, term: r.term, shortDefinition: r.shortDefinition })
  }

  if (out.length >= limit) return out

  const topicIds = current.topics.map((t) => t.topicId)
  if (!topicIds.length) return out

  const excludeIds = [current.id, ...Array.from(seen)]

  const candidates = await prisma.concept.findMany({
    where: {
      id: { notIn: excludeIds },
      status: 'published',
      deletedAt: null,
      topics: { some: { topicId: { in: topicIds } } },
    },
    orderBy: { updatedAt: 'desc' },
    take: (limit - out.length) * 4,
    select: {
      slug: true,
      term: true,
      shortDefinition: true,
      updatedAt: true,
      topics: { select: { topicId: true }, where: { topicId: { in: topicIds } } },
    },
  })

  const ranked = candidates
    .map((c) => ({ c, overlap: c.topics.length }))
    .sort((a, b) => {
      if (b.overlap !== a.overlap) return b.overlap - a.overlap
      return b.c.updatedAt.getTime() - a.c.updatedAt.getTime()
    })
    .slice(0, limit - out.length)

  for (const { c } of ranked) {
    out.push({ slug: c.slug, term: c.term, shortDefinition: c.shortDefinition })
  }

  return out
}

export async function getGuidesMentioningConcept(
  conceptId: string,
  limit = 10,
): Promise<RelatedGuide[]> {
  const mentions = await prisma.guideConceptMention.findMany({
    where: {
      conceptId,
      guide: { is: { status: 'published', deletedAt: null } },
    },
    orderBy: { guide: { updatedAt: 'desc' } },
    take: limit,
    include: {
      guide: {
        select: {
          slug: true,
          title: true,
          excerpt: true,
          readingMinutes: true,
          ogImage: true, heroImage: true,
          author: { select: { name: true, slug: true } },
        },
      },
    },
  })

  return mentions.map((m) => ({
    slug: m.guide.slug,
    title: m.guide.title,
    excerpt: m.guide.excerpt,
    readingMinutes: m.guide.readingMinutes,
    ogImage: m.guide.ogImage, heroImage: m.guide.heroImage,
    author: m.guide.author
      ? {
          name: m.guide.author.name ?? null,
          slug: m.guide.author.slug ?? null,
        }
      : null,
  }))
}
