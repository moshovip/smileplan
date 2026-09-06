import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkGuideAccess } from '@/lib/guides/authz'
import { pingIndexNow } from '@/lib/seo/indexnow'
import { routes } from '@/site.config'

interface Params {
  params: Promise<{ id: string }>
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(req: NextRequest, { params }: Params) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      authorId: true,
      content: true,
      title: true,
      scheduledPublishAt: true,
      publishedAt: true,
      topics: { include: { topic: { select: { slug: true } } } },
      author: { select: { slug: true } },
      series: { select: { slug: true } },
      conceptMentions: { select: { concept: { select: { slug: true } } } },
    },
  })
  if (!guide) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const access = await checkGuideAccess(me.id, me.isAdmin, guide.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (guide.status === 'published') {
    return NextResponse.json({ error: 'Already published' }, { status: 400 })
  }

  // Snapshot a final revision before publishing
  await prisma.guideRevision.create({
    data: { guideId: id, title: guide.title, content: guide.content, authorId: me.id },
  })

  const now = new Date()
  const willBeScheduled =
    guide.scheduledPublishAt && guide.scheduledPublishAt.getTime() > now.getTime()

  await prisma.guide.update({
    where: { id },
    data: {
      status: willBeScheduled ? 'scheduled' : 'published',
      publishedAt: guide.publishedAt ?? (willBeScheduled ? null : now),
    },
  })

  if (!willBeScheduled) {
    revalidatePath(routes.guide(guide.slug))
    revalidatePath(routes.guides())
    for (const t of guide.topics) {
      revalidatePath(routes.topic(t.topic.slug))
    }
    if (guide.author?.slug) {
      revalidatePath(routes.author(guide.author.slug))
      revalidatePath(routes.authors())
    }
    if (guide.series?.slug) {
      revalidatePath(routes.series(guide.series.slug))
    }
    for (const m of guide.conceptMentions) {
      revalidatePath(routes.concept(m.concept.slug))
    }
    revalidatePath('/sitemap.xml')
    revalidatePath('/sitemap-images.xml')
    revalidatePath('/llms.txt')
    revalidatePath('/llms-full.txt')

    const url = `${APP_URL}${routes.guide(guide.slug)}`
    void pingIndexNow([url]).catch(err => {
      console.error('[guides/publish] IndexNow failed:', err)
    })
  }

  return NextResponse.json({ ok: true, status: willBeScheduled ? 'scheduled' : 'published' })
}
