import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkEditorAccess } from '@/lib/guides/authz'
import { autoLinkConceptsWithCount } from '@/lib/mdx/auto-link-concepts'

export async function POST(req: NextRequest) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await checkEditorAccess(me.id, me.isAdmin)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const concepts = await prisma.concept.findMany({
    where: { status: 'published', deletedAt: null },
    select: { term: true, slug: true },
    take: 500,
  })

  const { content, linked } = autoLinkConceptsWithCount(body.content ?? '', concepts)
  return NextResponse.json({ content, linked })
}
