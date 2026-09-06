import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ConceptForm } from './concept-form'

export const metadata = {
  title: 'Edit concept — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditConceptPage({ params }: Props) {
  const { id } = await params
  const [concept, authors, allConcepts, topics] = await Promise.all([
    prisma.concept.findUnique({
      where: { id },
      include: {
        topics: true,
        relatedConcepts: { select: { id: true } },
      },
    }),
    prisma.author.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.concept.findMany({
      where: { deletedAt: null },
      select: { id: true, term: true, slug: true },
      orderBy: { term: 'asc' },
    }),
    prisma.topic.findMany({ select: { id: true, slug: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  if (!concept) notFound()

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/concepts" className="text-text-dim hover:text-text text-[13px]">
          ← Back to list
        </Link>
        <h1 className="font-head text-[24px] text-text mt-2">{concept.term}</h1>
        <p className="text-text-dim text-[13px] mt-1">
          Status: {concept.status} · /{concept.slug}
        </p>
      </div>

      <ConceptForm
        mode="edit"
        authors={authors}
        topics={topics}
        allConcepts={allConcepts.filter(c => c.id !== concept.id)}
        concept={{
          id: concept.id,
          slug: concept.slug,
          term: concept.term,
          shortDefinition: concept.shortDefinition,
          longExplanation: concept.longExplanation ?? '',
          metaTitle: concept.metaTitle ?? '',
          metaDescription: concept.metaDescription ?? '',
          ogImage: concept.ogImage ?? '',
          authorId: concept.authorId,
          status: concept.status,
          topicIds: concept.topics.map(t => t.topicId),
          relatedConceptIds: concept.relatedConcepts.map(r => r.id),
        }}
      />
    </>
  )
}
