import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { checkOrigin } from '@/lib/csrf'
import { checkEditorAccess } from '@/lib/guides/authz'

const STOP_WORDS = new Set([
  'и', 'в', 'на', 'не', 'с', 'по', 'для', 'от', 'к', 'у', 'из', 'за', 'до', 'о',
  'что', 'это', 'как', 'или', 'но', 'а', 'же', 'бы', 'ли', 'все', 'вот', 'ещё',
  'был', 'была', 'было', 'были', 'есть', 'нет', 'да', 'я', 'ты', 'он', 'она',
  'мы', 'вы', 'они', 'себя', 'свой', 'свою', 'свои', 'мой', 'твой', 'наш',
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for',
])

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/<[^>]+>/g, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .split(/[^a-zа-яё0-9-]+/i)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  )
}

function score(haystackTokens: Set<string>, candidate: string): number {
  const candTokens = candidate
    .toLowerCase()
    .split(/[^a-zа-яё0-9-]+/i)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  if (!candTokens.length) return 0
  let hits = 0
  for (const t of candTokens) if (haystackTokens.has(t)) hits += 1
  return hits / candTokens.length
}

export async function POST(req: NextRequest) {
  const csrf = checkOrigin(req)
  if (csrf) return csrf
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const access = await checkEditorAccess(me.id, me.isAdmin)
  if (!access) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { content?: string; excludeId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = body.content ?? ''
  const tokens = tokenize(content)
  if (tokens.size === 0) return NextResponse.json({ suggestions: [] })

  const [guides, concepts] = await Promise.all([
    prisma.guide.findMany({
      where: { status: 'published', deletedAt: null, ...(body.excludeId ? { id: { not: body.excludeId } } : {}) },
      select: { title: true, slug: true },
      take: 200,
    }),
    prisma.concept.findMany({
      where: { status: 'published', deletedAt: null },
      select: { term: true, slug: true },
      take: 200,
    }),
  ])

  const suggestions: Array<{ type: 'guide' | 'concept'; title: string; slug: string; score: number }> = []

  for (const g of guides) {
    const s = score(tokens, g.title)
    if (s > 0.4) suggestions.push({ type: 'guide', title: g.title, slug: g.slug, score: s })
  }
  for (const c of concepts) {
    const s = score(tokens, c.term)
    if (s > 0.4) suggestions.push({ type: 'concept', title: c.term, slug: c.slug, score: s })
  }

  suggestions.sort((a, b) => b.score - a.score)
  return NextResponse.json({ suggestions: suggestions.slice(0, 10) })
}
