import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isGuideSlugTaken, slugify } from '@/lib/guides/slug'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

  let body: {
    title?: string
    slug?: string
    type?: 'pillar' | 'tutorial' | 'playbook' | 'recipe'
    authorId?: string
    topicIds?: string[]
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!body.authorId) return NextResponse.json({ error: 'authorId is required' }, { status: 400 })
  if (!body.type) return NextResponse.json({ error: 'type is required' }, { status: 400 })

  let slug = body.slug?.trim() || slugify(body.title)
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
  }
  // Append a numeric suffix if the slug is already taken.
  let i = 2
  const original = slug
  while (await isGuideSlugTaken(slug)) {
    slug = `${original}-${i++}`
    if (i > 50) break
  }

  const author = await prisma.author.findFirst({
    where: { id: body.authorId, deletedAt: null },
    select: { id: true },
  })
  if (!author) {
    return NextResponse.json({ error: 'Author not found' }, { status: 400 })
  }

  const guide = await prisma.guide.create({
    data: {
      slug,
      title: body.title.trim(),
      metaDescription: '',
      excerpt: '',
      type: body.type,
      content: '',
      authorId: body.authorId,
      status: 'draft',
      // Create the stats row right away — otherwise sorting /guides by views would float guides without one to the top.
      stats: { create: {} },
      topics: body.topicIds?.length
        ? {
            create: body.topicIds.map(topicId => ({ topicId })),
          }
        : undefined,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ id: guide.id, slug: guide.slug }, { status: 201 })
}
