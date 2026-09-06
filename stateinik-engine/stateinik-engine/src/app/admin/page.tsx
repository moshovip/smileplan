import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { siteConfig } from '@/site.config'

export const dynamic = 'force-dynamic'

async function counts() {
  const [guides, published, concepts, authors] = await Promise.all([
    prisma.guide.count({ where: { deletedAt: null } }),
    prisma.guide.count({ where: { status: 'published', deletedAt: null } }),
    siteConfig.hasConcepts ? prisma.concept.count({ where: { deletedAt: null } }) : Promise.resolve(0),
    prisma.author.count({ where: { deletedAt: null } }),
  ])
  return { guides, published, concepts, authors }
}

export default async function AdminDashboard() {
  const c = await counts()
  const cards = [
    { label: 'Guides', value: c.guides, sub: `${c.published} published`, href: '/admin/guides' },
    ...(siteConfig.hasConcepts ? [{ label: 'Concepts', value: c.concepts, sub: 'glossary', href: '/admin/concepts' }] : []),
    { label: 'Authors', value: c.authors, sub: '', href: '/admin/authors' },
  ]

  return (
    <div>
      <h1 className="font-head text-3xl">Dashboard</h1>
      <p className="mt-2 text-text-sub">Manage your content.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-border bg-bg-card p-6 transition hover:border-accent"
          >
            <div className="text-sm text-text-sub">{card.label}</div>
            <div className="mt-2 font-head text-4xl text-text">{card.value}</div>
            {card.sub && <div className="mt-1 text-xs text-text-dim">{card.sub}</div>}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <Link
          href="/admin/guides/new"
          className="inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
        >
          New guide
        </Link>
      </div>
    </div>
  )
}
