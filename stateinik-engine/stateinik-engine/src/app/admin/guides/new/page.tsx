import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { NewGuideForm } from './new-guide-form'

export const metadata = {
  title: 'New guide — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default async function NewGuidePage() {
  const [user, authorRows, topics] = await Promise.all([
    getCurrentUser(),
    prisma.author.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.topic.findMany({ select: { id: true, slug: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  const authors = authorRows.map(a => ({
    id: a.id,
    publicName: a.name,
    firstName: null,
    lastName: null,
    email: '',
  }))

  const defaultAuthorId = (user && authors.find(a => a.id === user.id)?.id) || undefined

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/guides" className="text-text-dim hover:text-text text-[13px]">
          ← Back to guides
        </Link>
        <h1 className="font-head text-[28px] text-text mt-2">New guide</h1>
        <p className="text-text-dim text-[13px] mt-1">
          Fill in the basics — title, type and author. You can add the rest in the editor.
        </p>
      </div>

      <NewGuideForm authors={authors} topics={topics} defaultAuthorId={defaultAuthorId} />
    </>
  )
}
