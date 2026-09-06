import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isConceptSlugTaken, slugify } from '@/lib/guides/slug'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

  let body: {
    term?: string
    slug?: string
    shortDefinition?: string
    longExplanation?: string | null
    metaTitle?: string | null
    metaDescription?: string | null
    ogImage?: string | null
    authorId?: string | null
    topicIds?: string[]
    relatedConceptIds?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.term?.trim()) return NextResponse.json({ error: 'term required' }, { status: 400 })
  if (!body.shortDefinition?.trim()) {
    return NextResponse.json({ error: 'shortDefinition required' }, { status: 400 })
  }

  let slug = body.slug?.trim() || slugify(body.term)
  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  let i = 2
  const original = slug
  while (await isConceptSlugTaken(slug)) {
    slug = `${original}-${i++}`
    if (i > 50) break
  }

  const c = await prisma.concept.create({
    data: {
      slug,
      term: body.term.trim(),
      shortDefinition: body.shortDefinition,
      longExplanation: body.longExplanation || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      ogImage: body.ogImage || null,
      authorId: body.authorId || null,
      topics: body.topicIds?.length
        ? { create: body.topicIds.map(topicId => ({ topicId })) }
        : undefined,
      relatedConcepts: body.relatedConceptIds?.length
        ? { connect: body.relatedConceptIds.map(id => ({ id })) }
        : undefined,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ id: c.id, slug: c.slug }, { status: 201 })
}
