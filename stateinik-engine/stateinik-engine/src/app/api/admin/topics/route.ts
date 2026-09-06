import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, slugify } from '@/lib/guides/slug'

async function isTopicSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.topic.findFirst({
    where: { slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    select: { id: true },
  })
  return existing !== null
}

// GET — list every topic with its usage counts (admin taxonomy management).
export async function GET(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

  const topics = await prisma.topic.findMany({
    orderBy: { title: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      _count: { select: { guides: true, concepts: true } },
    },
  })
  return NextResponse.json({ topics })
}

// POST — create a topic.
export async function POST(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

  let body: { title?: string; slug?: string; description?: string | null }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  let slug = body.slug?.trim() || slugify(body.title)
  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  // Append a numeric suffix if the slug is already taken.
  let i = 2
  const original = slug
  while (await isTopicSlugTaken(slug)) {
    slug = `${original}-${i++}`
    if (i > 50) break
  }

  const topic = await prisma.topic.create({
    data: { slug, title: body.title.trim(), description: body.description?.trim() || null },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ id: topic.id, slug: topic.slug }, { status: 201 })
}
