import { prisma } from '@/lib/prisma'
import { TopicsManager } from '@/components/admin/TopicsManager'

export const metadata = {
  title: 'Topics — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default async function AdminTopicsPage() {
  const rows = await prisma.topic.findMany({
    orderBy: { title: 'asc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      _count: { select: { guides: true, concepts: true } },
    },
  })

  const topics = rows.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    guides: t._count.guides,
    concepts: t._count.concepts,
  }))

  return (
    <>
      <div className="mb-6">
        <h1 className="font-head text-[28px] text-text">Topics</h1>
        <p className="text-text-dim text-[13px] mt-1">
          The taxonomy that groups guides and concepts. {topics.length} total.
        </p>
      </div>
      <TopicsManager initialTopics={topics} />
    </>
  )
}
