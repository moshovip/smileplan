import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { isValidSlug, isGuideSlugTaken } from '@/lib/guides/slug'
import { checkGuideAccess, stripAdminOnlyFields } from '@/lib/guides/authz'
import { routes } from '@/site.config'
import { validateMdxSource } from '@/lib/mdx/sanitize'
import { normalizeCodeBlocks } from '@/lib/mdx/normalize-code-blocks'
import { calculateReadingMinutes } from '@/lib/mdx/reading-time'
import { syncGuideConceptMentions } from '@/lib/concepts/mentions'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf

  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, authorId: true, deletedAt: true },
  })
  if (!guide || guide.deletedAt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const access = await checkGuideAccess(me.id, me.isAdmin, guide.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return processUpdate(req, id, access.isAdmin)
}

interface UpdateBody {
  title?: string
  slug?: string
  metaTitle?: string | null
  metaDescription?: string
  excerpt?: string
  targetKeyword?: string | null
  type?: 'pillar' | 'tutorial' | 'playbook' | 'recipe'
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  content?: string
  pillarId?: string | null
  seriesId?: string | null
  seriesOrder?: number | null
  topicIds?: string[]
  prerequisiteIds?: string[]
  requiredTools?: unknown
  heroPromise?: unknown
  h1Variants?: unknown
  primaryCta?: unknown
  changelogEntries?: unknown
  ogImage?: string | null
  scheduledPublishAt?: string | null
  isPinned?: boolean
  authorId?: string
  reviewedById?: string | null
}

async function processUpdate(req: NextRequest, id: string, isAdmin: boolean) {
  let body: UpdateBody
  try {
    body = (await req.json()) as UpdateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Non-admin authors cannot change admin-only fields
  // (authorId, reviewedById, pillarId, seriesId, seriesOrder, isPinned).
  if (!isAdmin) {
    body = stripAdminOnlyFields(body as Record<string, unknown>) as UpdateBody
  }

  const current = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, slug: true, content: true, title: true },
  })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Validate the slug when it changes.
  let slugChanged = false
  if (body.slug !== undefined && body.slug !== current.slug) {
    if (!isValidSlug(body.slug)) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    if (await isGuideSlugTaken(body.slug, id)) {
      return NextResponse.json({ error: 'Slug already taken' }, { status: 409 })
    }
    slugChanged = true
  }

  // Normalize JSX <CodeBlock> → fenced ``` before validation. RSC drops the
  // contents of multi-line {`...`} → empty code blocks. The MdxPre override
  // makes fenced blocks equivalent to CodeBlock. See src/lib/mdx/normalize-code-blocks.ts.
  if (body.content !== undefined) {
    body.content = normalizeCodeBlocks(body.content).content
  }

  // Validate MDX (when content changes).
  if (body.content !== undefined) {
    const validation = validateMdxSource(body.content.replace(/^---\n[\s\S]*?\n---\n/, ''))
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'MDX validation failed', details: validation.errors },
        { status: 400 }
      )
    }
  }

  // Validate h1Variants — must be an array of { text, weight } objects.
  if (body.h1Variants !== undefined && body.h1Variants !== null) {
    if (!Array.isArray(body.h1Variants)) {
      return NextResponse.json({ error: 'h1Variants must be an array' }, { status: 400 })
    }
  }

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.metaTitle !== undefined) data.metaTitle = body.metaTitle || null
  if (body.metaDescription !== undefined) data.metaDescription = body.metaDescription
  if (body.excerpt !== undefined) data.excerpt = body.excerpt
  if (body.targetKeyword !== undefined) data.targetKeyword = body.targetKeyword || null
  if (body.type !== undefined) data.type = body.type
  if (body.difficulty !== undefined) data.difficulty = body.difficulty
  if (body.pillarId !== undefined) data.pillarId = body.pillarId
  if (body.seriesId !== undefined) data.seriesId = body.seriesId
  if (body.seriesOrder !== undefined) data.seriesOrder = body.seriesOrder
  if (body.requiredTools !== undefined) data.requiredTools = body.requiredTools
  if (body.heroPromise !== undefined) data.heroPromise = body.heroPromise
  if (body.h1Variants !== undefined) data.h1Variants = body.h1Variants
  if (body.primaryCta !== undefined) data.primaryCta = body.primaryCta
  if (body.changelogEntries !== undefined) data.changelogEntries = body.changelogEntries
  if (body.ogImage !== undefined) data.ogImage = body.ogImage || null
  if (body.scheduledPublishAt !== undefined) {
    if (body.scheduledPublishAt) {
      const d = new Date(body.scheduledPublishAt)
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Invalid scheduledPublishAt date' }, { status: 400 })
      }
      data.scheduledPublishAt = d
    } else {
      data.scheduledPublishAt = null
    }
  }
  if (body.isPinned !== undefined) data.isPinned = body.isPinned
  if (body.authorId !== undefined) data.authorId = body.authorId
  if (body.reviewedById !== undefined) data.reviewedById = body.reviewedById

  if (body.content !== undefined) {
    data.content = body.content
    data.readingMinutes = calculateReadingMinutes(body.content)
    // Approx word count (for SEO stats)
    const words = body.content
      .replace(/^---\n[\s\S]*?\n---\n/, '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
      .match(/[A-Za-zА-Яа-яЁё0-9]+/g)
    data.wordCount = words ? words.length : 0
  }

  if (slugChanged && body.slug) {
    data.slug = body.slug
    // Record the old slug in history
    await prisma.guideSlugHistory.upsert({
      where: { oldSlug: current.slug },
      update: { changedAt: new Date() },
      create: { guideId: id, oldSlug: current.slug },
    })
  }

  // Update topics if provided
  if (body.topicIds !== undefined) {
    await prisma.guideTopic.deleteMany({ where: { guideId: id } })
    if (body.topicIds.length) {
      await prisma.guideTopic.createMany({
        data: body.topicIds.map(topicId => ({ guideId: id, topicId })),
      })
    }
  }

  if (body.prerequisiteIds !== undefined) {
    await prisma.guidePrerequisite.deleteMany({ where: { guideId: id } })
    if (body.prerequisiteIds.length) {
      await prisma.guidePrerequisite.createMany({
        data: body.prerequisiteIds.map(prerequisiteId => ({ guideId: id, prerequisiteId })),
      })
    }
  }

  const result = await prisma.$transaction(async tx => {
    const u = await tx.guide.update({
      where: { id },
      data,
      select: { id: true, slug: true, status: true },
    })
    let mentionsSync: { added: string[]; removed: string[] } | null = null
    if (body.content !== undefined) {
      const s = await syncGuideConceptMentions(id, body.content, tx)
      mentionsSync = { added: s.added, removed: s.removed }
    }
    return { ...u, mentionsSync }
  })

  // Revalidate AFTER the transaction succeeds, not inside it.
  if (result.status === 'published') {
    revalidatePath(routes.guide(result.slug))
    if (slugChanged) revalidatePath(routes.guide(current.slug))
    revalidatePath(routes.guides())
  }
  // Affected concepts (union of added + removed) — even for drafts, so the cache
  // isn't stale on a future publish. Costs next to nothing.
  if (result.mentionsSync) {
    const affected = Array.from(
      new Set<string>([...result.mentionsSync.added, ...result.mentionsSync.removed]),
    )
    for (const slug of affected) {
      revalidatePath(routes.concept(slug))
    }
  }

  return NextResponse.json({ ok: true, slug: result.slug, slugChanged }, { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf

  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.guide.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      deletedAt: true,
      topics: { select: { topic: { select: { slug: true } } } },
      author: { select: { slug: true } },
      series: { select: { slug: true } },
      conceptMentions: { select: { concept: { select: { slug: true } } } },
    },
  })
  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const access = await checkGuideAccess(me.id, me.isAdmin, existing.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const g = await prisma.guide.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'archived' },
    select: { slug: true, status: true },
  })
  revalidatePath(routes.guides())
  revalidatePath(routes.guide(g.slug))
  for (const t of existing.topics) {
    revalidatePath(routes.topic(t.topic.slug))
  }
  if (existing.author?.slug) {
    revalidatePath(routes.author(existing.author.slug))
    revalidatePath(routes.authors())
  }
  if (existing.series?.slug) {
    revalidatePath(routes.series(existing.series.slug))
  }
  for (const m of existing.conceptMentions) {
    revalidatePath(routes.concept(m.concept.slug))
  }
  revalidatePath('/sitemap.xml')
  revalidatePath('/sitemap-images.xml')
  revalidatePath('/llms.txt')
  revalidatePath('/llms-full.txt')

  return NextResponse.json({ ok: true })
}
