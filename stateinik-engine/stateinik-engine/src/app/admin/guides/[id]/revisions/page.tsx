import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { RevisionRow } from './revision-row'

export const metadata = {
  title: 'Guide revisions — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GuideRevisionsPage({ params }: Props) {
  const { id } = await params
  const guide = await prisma.guide.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true },
  })
  if (!guide) notFound()

  const revisions = await prisma.guideRevision.findMany({
    where: { guideId: id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  // GuideRevision.authorId is a plain string id — resolve display names from Author.
  const authorIds = Array.from(new Set(revisions.map(r => r.authorId)))
  const authors = await prisma.author.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true },
  })
  const authorMap = new Map(authors.map(a => [a.id, a.name]))

  return (
    <>
      <div className="mb-6">
        <Link href={`/admin/guides/${id}`} className="text-text-dim hover:text-text text-[13px]">
          ← Back to editor
        </Link>
        <h1 className="font-head text-[24px] text-text mt-2">Revisions: {guide.title}</h1>
        <p className="text-text-dim text-[13px] mt-1">
          {revisions.length} revisions · Autosave creates a revision every 30 seconds while editing.
        </p>
      </div>

      {revisions.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No revisions yet. Open the editor and wait 30 seconds — the first one is created automatically.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl divide-y divide-border">
          {revisions.map(r => (
            <RevisionRow
              key={r.id}
              guideId={id}
              revision={{
                id: r.id,
                title: r.title,
                createdAt: r.createdAt.toISOString(),
                authorName: authorMap.get(r.authorId) ?? r.authorId,
                contentPreview: r.content.slice(0, 200),
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
