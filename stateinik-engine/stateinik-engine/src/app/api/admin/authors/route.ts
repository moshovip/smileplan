import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { slugify } from '@/lib/mdx/extract'
import { isValidSlug, isAuthorSlugTaken } from '@/lib/guides/slug'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

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

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  let slug = typeof body.slug === 'string' ? body.slug.trim() : ''
  if (slug) {
    if (!isValidSlug(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    if (await isAuthorSlugTaken(slug)) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
  } else {
    const base = slugify(name) || 'author'
    let candidate = base
    let i = 1
    while (await isAuthorSlugTaken(candidate)) candidate = `${base}-${i++}`
    slug = candidate
  }

  const author = await prisma.author.create({
    data: {
      slug,
      name,
      title: body.title?.trim() || null,
      bio: body.bio?.trim() || null,
      avatar: body.avatar?.trim() || null,
      email: body.email?.trim() || null,
      socialLinks: body.socialLinks ? (body.socialLinks as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
    select: { id: true },
  })

  return NextResponse.json({ id: author.id }, { status: 201 })
}
