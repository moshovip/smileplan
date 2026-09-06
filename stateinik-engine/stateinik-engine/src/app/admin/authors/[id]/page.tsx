import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AuthorForm } from './author-form'

export const metadata = {
  title: 'Author profile — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminAuthorEditPage({ params }: Props) {
  const { id } = await params
  const author = await prisma.author.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      title: true,
      bio: true,
      avatar: true,
      slug: true,
      socialLinks: true,
      _count: { select: { guides: true, concepts: true } },
    },
  })
  if (!author) notFound()

  return (
    <>
      <div className="mb-6">
        <Link href="/admin/authors" className="text-text-dim hover:text-text text-[13px]">
          ← Back to authors
        </Link>
        <h1 className="font-head text-[28px] text-text mt-2">{author.name}</h1>
        <p className="text-text-dim text-[13px] mt-1">
          {author.email || '—'} · guides: {author._count.guides} · concepts: {author._count.concepts}
        </p>
      </div>

      <AuthorForm author={author} />
    </>
  )
}
