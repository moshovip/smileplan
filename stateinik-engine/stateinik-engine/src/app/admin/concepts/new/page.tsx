import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ConceptForm } from '../[id]/concept-form'

export const metadata = {
  title: 'New concept — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default async function NewConceptPage() {
  const [me, authors, allConcepts, topics] = await Promise.all([
    getCurrentUser(),
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

  const defaultAuthorId = (me && authors.find(a => a.id === me.id)?.id) || authors[0]?.id || ''

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/concepts" className="text-text-dim hover:text-text text-[13px]">
          ← Back to concepts
        </Link>
        <h1 className="font-head text-[28px] text-text mt-2">New concept</h1>
      </div>

      <ConceptForm
        mode="create"
        authors={authors}
        topics={topics}
        allConcepts={allConcepts}
        defaultAuthorId={defaultAuthorId}
      />
    </>
  )
}
