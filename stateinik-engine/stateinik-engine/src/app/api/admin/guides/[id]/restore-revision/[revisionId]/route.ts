import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkGuideAccess } from '@/lib/guides/authz'
import { validateMdxSource } from '@/lib/mdx/sanitize'
import { normalizeCodeBlocks } from '@/lib/mdx/normalize-code-blocks'

interface Params {
  params: Promise<{ id: string; revisionId: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, revisionId } = await params

  const [guide, revision] = await Promise.all([
    prisma.guide.findUnique({
      where: { id },
      select: { id: true, authorId: true, content: true, title: true },
    }),
    prisma.guideRevision.findUnique({ where: { id: revisionId } }),
  ])
  if (!guide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
  if (!revision || revision.guideId !== id) {
    return NextResponse.json({ error: 'Revision not found' }, { status: 404 })
  }
  const access = await checkGuideAccess(me.id, me.isAdmin, guide.authorId)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Defense-in-depth: the revision may have been saved before we started validating
  // MDX on this endpoint — don't let unparseable MDX overwrite live content.
  const validation = validateMdxSource(
    revision.content.replace(/^---\n[\s\S]*?\n---\n/, ''),
  )
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'Cannot restore: revision content fails MDX validation', details: validation.errors },
      { status: 400 },
    )
  }

  // Snapshot the current state before rolling back
  await prisma.guideRevision.create({
    data: { guideId: id, title: guide.title, content: guide.content, authorId: me.id },
  })

  // Older revisions may contain JSX <CodeBlock>{`...`}</CodeBlock> — empty
  // blocks on render. Normalize them on restore (see normalize-code-blocks.ts).
  const restoredContent = normalizeCodeBlocks(revision.content).content

  await prisma.guide.update({
    where: { id },
    data: { content: restoredContent, title: revision.title },
  })

  return NextResponse.json({ ok: true })
}
