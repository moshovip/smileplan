import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isValidSlug, isSeriesSlugTaken, slugify } from '@/lib/guides/slug'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth

  let body: { title?: string; slug?: string; description?: string | null; guideIds?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })

  let slug = body.slug?.trim() || slugify(body.title)
  if (!isValidSlug(slug)) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  let i = 2
  const original = slug
  while (await isSeriesSlugTaken(slug)) {
    slug = `${original}-${i++}`
    if (i > 50) break
  }

  const s = await prisma.guideSeries.create({
    data: {
      slug,
      title: body.title.trim(),
      description: body.description || null,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ id: s.id, slug: s.slug }, { status: 201 })
}
