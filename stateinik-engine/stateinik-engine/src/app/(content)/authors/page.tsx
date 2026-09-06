import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

// Index of live published rows — render at request time so `next build` /
// `docker build` never need a reachable database. Detail pages keep ISR.
export const dynamic = 'force-dynamic'

const APP_URL = siteConfig.url

export const metadata: Metadata = {
  title: `Authors — ${siteConfig.name}`,
  description: `The people writing on ${siteConfig.name}.`,
  alternates: { canonical: routes.authors() },
  openGraph: {
    title: `Authors — ${siteConfig.name}`,
    description: `The people writing on ${siteConfig.name}.`,
    url: `${APP_URL}${routes.authors()}`,
    siteName: siteConfig.name,
    type: 'website',
  },
}

export default async function AuthorsListPage() {
  const authors = await prisma.author.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      title: true,
      avatar: true,
      slug: true,
      _count: { select: { guides: { where: { status: 'published', deletedAt: null } } } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">
          Authors
        </h1>
        <p className="mt-4 text-text-sub text-lg max-w-narrow">
          The people who write on {siteConfig.name}.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {authors.map((a) => (
          <Link
            key={a.id}
            href={routes.author(a.slug)}
            className="group rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-6 flex gap-4 items-start"
          >
            {a.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={a.avatar}
                alt=""
                width={64}
                height={64}
                className="rounded-2xl border border-border object-cover shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-bg-card-hover border border-border flex items-center justify-center font-head text-xl text-text shrink-0">
                {(a.name ?? '?').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-semibold tracking-tight text-text group-hover:text-accent leading-snug">
                {a.name}
              </h3>
              {a.title && <p className="text-sm text-text-sub mt-1 line-clamp-2">{a.title}</p>}
              <p className="text-xs text-text-dim mt-2">{a._count.guides} guides</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
