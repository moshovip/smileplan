import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { routes } from '@/site.config'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isAuthorSlugTaken } from '@/lib/guides/slug'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  let body: {
    name?: string
    slug?: string
    title?: string
    bio?: string
    avatar?: string
    email?: string
    socialLinks?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const author = await prisma.author.findUnique({ where: { id }, select: { id: true } })
  if (!author) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.slug !== undefined && body.slug !== '') {
    if (!isValidSlug(body.slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    if (await isAuthorSlugTaken(body.slug, id)) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  }

  await prisma.author.update({
    where: { id },
    data: {
      ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}),
      ...(body.slug?.trim() ? { slug: body.slug.trim() } : {}),
      title: body.title?.trim() || null,
      bio: body.bio?.trim() || null,
      avatar: body.avatar?.trim() || null,
      email: body.email?.trim() || null,
      socialLinks: body.socialLinks ? (body.socialLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  })

  revalidatePath(routes.authors())
  revalidatePath(routes.guides())
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  await prisma.author.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  revalidatePath(routes.authors())
  return NextResponse.json({ ok: true })
}
