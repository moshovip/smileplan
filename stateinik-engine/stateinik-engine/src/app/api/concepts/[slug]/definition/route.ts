import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Powers the inline concept tooltip (DefinitionLink). Public, read-only.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const concept = await prisma.concept.findFirst({
    where: { slug, status: 'published', deletedAt: null },
    select: { shortDefinition: true },
  })
  if (!concept) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(
    { shortDefinition: concept.shortDefinition },
    { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
  )
}
