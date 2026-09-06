import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminApi } from '@/lib/auth-helpers'
import { isGuideSlugTaken } from '@/lib/guides/slug'
import { normalizeCodeBlocks } from '@/lib/mdx/normalize-code-blocks'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const auth = await verifyAdminApi(req)
  if (auth instanceof NextResponse) return auth
  const { id } = await params

  const source = await prisma.guide.findUnique({
    where: { id },
    include: { topics: true },
  })
  if (!source) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let newSlug = `${source.slug}-copy`
  let i = 2
  while (await isGuideSlugTaken(newSlug)) {
    newSlug = `${source.slug}-copy-${i++}`
    if (i > 50) {
      return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 })
    }
  }

  const copy = await prisma.guide.create({
    data: {
      slug: newSlug,
      title: `${source.title} (copy)`,
      metaTitle: source.metaTitle,
      metaDescription: source.metaDescription,
      excerpt: source.excerpt,
      heroPromise: source.heroPromise ?? undefined,
      h1Variants: source.h1Variants ?? undefined,
      targetKeyword: source.targetKeyword,
      type: source.type,
      difficulty: source.difficulty,
      content: normalizeCodeBlocks(source.content).content,
      pillarId: source.pillarId,
      authorId: source.authorId,
      reviewedById: source.reviewedById,
      seriesId: null,
      seriesOrder: null,
      requiredTools: source.requiredTools ?? undefined,
      primaryCta: source.primaryCta ?? undefined,
      ogImage: source.ogImage,
      readingMinutes: source.readingMinutes,
      wordCount: source.wordCount,
      status: 'draft',
      isPinned: false,
      changelogEntries: source.changelogEntries ?? undefined,
      topics: source.topics.length
        ? { create: source.topics.map(t => ({ topicId: t.topicId })) }
        : undefined,
    },
    select: { id: true, slug: true },
  })

  return NextResponse.json({ id: copy.id, slug: copy.slug }, { status: 201 })
}
