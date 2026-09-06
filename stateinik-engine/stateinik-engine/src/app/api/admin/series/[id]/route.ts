import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { routes } from '@/site.config'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isSeriesSlugTaken } from '@/lib/guides/slug'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let body: { title?: string; slug?: string; description?: string | null; guideIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const current = await prisma.guideSeries.findUnique({ where: { id }, select: { slug: true } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title.trim()
  if ('description' in body) data.description = body.description || null
  if (typeof body.slug === 'string' && body.slug !== current.slug) {
    if (!isValidSlug(body.slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    if (await isSeriesSlugTaken(body.slug, id)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    data.slug = body.slug
  }

  // Update guide associations
  if (Array.isArray(body.guideIds)) {
    // First remove all guides from this series
    await prisma.guide.updateMany({
      where: { seriesId: id },
      data: { seriesId: null, seriesOrder: null },
    })
    // Then reorder them from scratch
    for (let i = 0; i < body.guideIds.length; i++) {
      await prisma.guide.update({
        where: { id: body.guideIds[i] },
        data: { seriesId: id, seriesOrder: i + 1 },
      })
    }
  }

  const updated = await prisma.guideSeries.update({
    where: { id },
    data,
    select: { slug: true },
  })

  revalidatePath(routes.series(updated.slug))
  revalidatePath('/guides')

  return NextResponse.json({ ok: true, id, slug: updated.slug })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  // Unlink the guides and delete the series
  await prisma.guide.updateMany({
    where: { seriesId: id },
    data: { seriesId: null, seriesOrder: null },
  })
  await prisma.guideSeries.delete({ where: { id } })

  revalidatePath('/guides')
  return NextResponse.json({ ok: true })
}
