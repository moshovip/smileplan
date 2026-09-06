import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isConceptSlugTaken } from '@/lib/guides/slug'
import { routes } from '@/site.config'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const current = await prisma.concept.findUnique({ where: { id }, select: { slug: true } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newSlug = typeof body.slug === 'string' ? body.slug : undefined
  let slugChanged = false
  if (newSlug && newSlug !== current.slug) {
    if (!isValidSlug(newSlug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    if (await isConceptSlugTaken(newSlug, id)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    slugChanged = true
  }

  const data: Record<string, unknown> = {}
  if (typeof body.term === 'string') data.term = body.term.trim()
  if (typeof body.shortDefinition === 'string') data.shortDefinition = body.shortDefinition
  if ('longExplanation' in body) data.longExplanation = body.longExplanation || null
  if ('metaTitle' in body) data.metaTitle = body.metaTitle || null
  if ('metaDescription' in body) data.metaDescription = body.metaDescription || null
  if ('ogImage' in body) data.ogImage = body.ogImage || null
  if ('authorId' in body) data.authorId = body.authorId || null
  if (slugChanged && newSlug) {
    data.slug = newSlug
    await prisma.conceptSlugHistory.upsert({
      where: { oldSlug: current.slug },
      update: { changedAt: new Date() },
      create: { conceptId: id, oldSlug: current.slug },
    })
  }

  if (Array.isArray(body.topicIds)) {
    await prisma.conceptTopic.deleteMany({ where: { conceptId: id } })
    const ids = body.topicIds as string[]
    if (ids.length) {
      await prisma.conceptTopic.createMany({
        data: ids.map(topicId => ({ conceptId: id, topicId })),
      })
    }
  }

  if (Array.isArray(body.relatedConceptIds)) {
    await prisma.concept.update({
      where: { id },
      data: {
        relatedConcepts: {
          set: (body.relatedConceptIds as string[]).map(rid => ({ id: rid })),
        },
      },
    })
  }

  const updated = await prisma.concept.update({
    where: { id },
    data,
    select: { slug: true, status: true },
  })

  if (updated.status === 'published') {
    revalidatePath(routes.concept(updated.slug))
    revalidatePath(routes.concepts())
    if (slugChanged) revalidatePath(routes.concept(current.slug))
  }

  return NextResponse.json({ ok: true, slug: updated.slug, id })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const c = await prisma.concept.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'archived' },
    select: { slug: true },
  })
  revalidatePath(routes.concepts())
  revalidatePath(routes.concept(c.slug))
  return NextResponse.json({ ok: true })
}
