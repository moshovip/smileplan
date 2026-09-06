import { prisma } from '@/lib/prisma'

export type SocialLinks = {
  telegram?: string | null
  max?: string | null
  youtube?: string | null
  instagram?: string | null
  vk?: string | null
}

// Defence-in-depth: the slug comes from the DB, but if the admin form lets garbage through,
// `permanentRedirect('/guides/' + newSlug)` could become an open redirect when slug = '//evil.com'.
// Accept only kebab-case ASCII + basic Cyrillic. Length up to 200.
const SLUG_RE = /^[a-z0-9а-яё][a-z0-9а-яё-]{0,199}$/

function safeSlug(value: string | null | undefined): string | null {
  if (!value) return null
  if (!SLUG_RE.test(value)) return null
  return value
}

/**
 * If the slug isn't found in Guide, look it up in GuideSlugHistory
 * and return the current slug for a permanent redirect.
 */
export async function findGuideRedirectSlug(oldSlug: string): Promise<string | null> {
  if (!safeSlug(oldSlug)) return null
  const history = await prisma.guideSlugHistory.findUnique({
    where: { oldSlug },
    select: { guide: { select: { slug: true } } },
  })
  return safeSlug(history?.guide?.slug)
}

export async function findConceptRedirectSlug(oldSlug: string): Promise<string | null> {
  if (!safeSlug(oldSlug)) return null
  const history = await prisma.conceptSlugHistory.findUnique({
    where: { oldSlug },
    select: { concept: { select: { slug: true } } },
  })
  return safeSlug(history?.concept?.slug)
}
