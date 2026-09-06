import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/mdx/extract'

export { slugify }

const SLUG_RE = /^[a-z0-9а-яё][a-z0-9а-яё-]{0,199}$/

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug)
}

export async function isGuideSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.guide.findUnique({ where: { slug }, select: { id: true } })
  if (existing && existing.id !== excludeId) return true
  const inHistory = await prisma.guideSlugHistory.findUnique({
    where: { oldSlug: slug },
    select: { guideId: true },
  })
  if (inHistory && inHistory.guideId !== excludeId) return true
  return false
}

export async function isConceptSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.concept.findUnique({ where: { slug }, select: { id: true } })
  if (existing && existing.id !== excludeId) return true
  const inHistory = await prisma.conceptSlugHistory.findUnique({
    where: { oldSlug: slug },
    select: { conceptId: true },
  })
  if (inHistory && inHistory.conceptId !== excludeId) return true
  return false
}

export async function isAuthorSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.author.findUnique({
    where: { slug },
    select: { id: true },
  })
  return !!existing && existing.id !== excludeId
}

export async function isSeriesSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.guideSeries.findUnique({
    where: { slug },
    select: { id: true },
  })
  return !!existing && existing.id !== excludeId
}
