import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkGuideAccess } from '@/lib/guides/authz'
import { validateMdxSource } from '@/lib/mdx/sanitize'

interface Params {
  params: Promise<{ id: string }>
}

// POST — create a revision (used by autosave)
export async function POST(req: NextRequest, { params }: Params) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf

  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, authorId: true, content: true, title: true },
  })
  if (!guide) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const access = await checkGuideAccess(me.id, me.isAdmin, guide.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: string; title?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = body.content ?? guide.content
  const title = body.title ?? guide.title

  // Same whitelist as in PUT — so a revision can always be restored and rendered.
  if (body.content !== undefined) {
    const validation = validateMdxSource(
      content.replace(/^---\n[\s\S]*?\n---\n/, ''),
    )
    if (!validation.ok) {
      return NextResponse.json(
        { error: 'MDX validation failed', details: validation.errors },
        { status: 400 },
      )
    }
  }

  // Skip creating a revision if nothing changed from the last one
  const last = await prisma.guideRevision.findFirst({
    where: { guideId: id },
    orderBy: { createdAt: 'desc' },
    select: { content: true, title: true },
  })
  if (last && last.content === content && last.title === title) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await prisma.guideRevision.create({
    data: { guideId: id, content, title, authorId: me.id },
  })

  return NextResponse.json({ ok: true })
}

// GET — list revisions
export async function GET(_req: NextRequest, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, authorId: true },
  })
  if (!guide) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const access = await checkGuideAccess(me.id, me.isAdmin, guide.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const revisions = await prisma.guideRevision.findMany({
    where: { guideId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: { id: true, title: true, authorId: true, createdAt: true },
  })

  return NextResponse.json({ revisions })
}
