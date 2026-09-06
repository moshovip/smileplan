import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug } from '@/lib/guides/slug'
import { routes } from '@/site.config'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let body: { title?: string; slug?: string; description?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const current = await prisma.topic.findUnique({ where: { id }, select: { slug: true } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title.trim()
  if ('description' in body) data.description = body.description?.trim() || null
  if (typeof body.slug === 'string' && body.slug !== current.slug) {
    if (!isValidSlug(body.slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    const taken = await prisma.topic.findFirst({
      where: { slug: body.slug, NOT: { id } },
      select: { id: true },
    })
    if (taken) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    data.slug = body.slug
  }

  const updated = await prisma.topic.update({ where: { id }, data, select: { slug: true } })

  revalidatePath(routes.topic(updated.slug))
  if (data.slug && current.slug !== updated.slug) revalidatePath(routes.topic(current.slug))
  revalidatePath(routes.guides())

  return NextResponse.json({ ok: true, id, slug: updated.slug })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const current = await prisma.topic.findUnique({ where: { id }, select: { slug: true } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // The GuideTopic / ConceptTopic join rows cascade-delete via the schema relations,
  // so guides and concepts simply lose this tag.
  await prisma.topic.delete({ where: { id } })

  revalidatePath(routes.topic(current.slug))
  revalidatePath(routes.guides())
  return NextResponse.json({ ok: true })
}
