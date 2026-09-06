import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { AddAuthorButton } from './add-author-button'

export const metadata = {
  title: 'Authors — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default async function AdminAuthorsPage() {
  const authors = await prisma.author.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      title: true,
      avatar: true,
      slug: true,
      joinedAt: true,
      _count: { select: { guides: true, concepts: true } },
    },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[28px] text-text">Authors</h1>
          <p className="text-text-dim text-[13px] mt-1">
            Public profiles for guides and concepts
          </p>
        </div>
        <AddAuthorButton />
      </div>

      {authors.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No authors yet — add the first one with the button in the top right.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border text-left text-text-dim text-[12px] uppercase tracking-[0.1em]">
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Slug</th>
                <th className="px-5 py-3 text-right">Guides</th>
                <th className="px-5 py-3 text-right">Concepts</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {authors.map(a => {
                const displayName = a.name
                return (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/authors/${a.id}`}
                        className="flex items-center gap-3 text-text hover:text-accent"
                      >
                        {a.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.avatar}
                            alt={displayName}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-text-dim text-[14px]">
                            {displayName.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span>{displayName}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-text-sub">{a.title || '—'}</td>
                    <td className="px-5 py-3 font-mono text-[12px] text-text-dim">
                      {a.slug || '—'}
                    </td>
                    <td className="px-5 py-3 text-right text-text-sub">{a._count.guides}</td>
                    <td className="px-5 py-3 text-right text-text-sub">{a._count.concepts}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/authors/${a.id}`}
                        className="text-accent hover:text-accent-hover text-[13px]"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
