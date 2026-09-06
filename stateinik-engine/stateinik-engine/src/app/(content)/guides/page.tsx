import type { Metadata } from 'next'
import type { Prisma } from '@prisma/client'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'
import { GuideCard } from '@/components/guides/GuideCard'

// Index of live published rows — render at request time so `next build` /
// `docker build` never need a reachable database. Detail pages keep ISR.
export const dynamic = 'force-dynamic'

const APP_URL = siteConfig.url
const PAGE_SIZE = 24

export const metadata: Metadata = {
  title: `Guides — ${siteConfig.name}`,
  description: siteConfig.description,
  alternates: { canonical: routes.guides() },
  openGraph: {
    title: `Guides — ${siteConfig.name}`,
    description: siteConfig.description,
    url: `${APP_URL}${routes.guides()}`,
    siteName: siteConfig.name,
    type: 'website',
  },
}

interface PageProps {
  searchParams?: Promise<{
    topic?: string
    difficulty?: string
    type?: string
    sort?: string
    page?: string
  }>
}

export default async function GuidesIndexPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const page = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const sort: 'popular' | 'new' = params.sort === 'new' ? 'new' : 'popular'

  const where: Prisma.GuideWhereInput = {
    status: 'published',
    deletedAt: null,
    ...(params.difficulty
      ? { difficulty: params.difficulty as 'beginner' | 'intermediate' | 'advanced' }
      : {}),
    ...(params.type ? { type: params.type as 'pillar' | 'tutorial' | 'playbook' | 'recipe' } : {}),
    ...(params.topic ? { topics: { some: { topic: { slug: params.topic } } } } : {}),
  }

  // "Popular" — by reader count. "New" — by publish date. Pinned always first.
  const orderBy: Prisma.GuideOrderByWithRelationInput[] =
    sort === 'new'
      ? [{ isPinned: 'desc' }, { publishedAt: 'desc' }]
      : [{ isPinned: 'desc' }, { stats: { viewsCount: 'desc' } }, { publishedAt: 'desc' }]

  const cardInclude = {
    stats: { select: { viewsCount: true } },
  } satisfies Prisma.GuideInclude

  const [pinnedAll, total, items, topics] = await Promise.all([
    page === 1
      ? prisma.guide.findMany({
          where: { ...where, isPinned: true },
          include: cardInclude,
          orderBy: { publishedAt: 'desc' },
          take: 3,
        })
      : Promise.resolve([]),
    prisma.guide.count({ where }),
    prisma.guide.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    // Only topics that have published guides — don't show empty filters.
    prisma.topic.findMany({
      where: { guides: { some: { guide: { is: { status: 'published', deletedAt: null } } } } },
      orderBy: { title: 'asc' },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const pageHref = (p: number): string => {
    const qs = new URLSearchParams()
    if (params.topic) qs.set('topic', params.topic)
    if (sort === 'new') qs.set('sort', 'new')
    if (p > 1) qs.set('page', String(p))
    const s = qs.toString()
    return s ? `${routes.guides()}?${s}` : routes.guides()
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10 sm:mb-14">
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">
          Guides
        </h1>
        <p className="mt-4 text-text-sub text-lg max-w-narrow">
          {siteConfig.description}
        </p>
      </header>

      {/* Sort */}
      <nav aria-label="Sort" className="flex gap-2 mb-4">
        <SortTab href={buildHref({ topic: params.topic })} label="Popular" active={sort === 'popular'} />
        <SortTab href={buildHref({ topic: params.topic, sort: 'new' })} label="New" active={sort === 'new'} />
      </nav>

      {/* Topic filters */}
      <nav aria-label="Filter by topic" className="flex flex-wrap gap-2 mb-10">
        <FilterChip href={buildHref({ sort: params.sort })} label="All topics" active={!params.topic} />
        {topics.map((t) => (
          <FilterChip
            key={t.slug}
            href={buildHref({ topic: t.slug, sort: params.sort })}
            label={t.title}
            active={params.topic === t.slug}
          />
        ))}
      </nav>

      {pinnedAll.length > 0 && (
        <section className="mb-12">
          <h2 className="text-text-sub text-[11px] font-semibold uppercase tracking-[0.15em] mb-4">
            Featured
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pinnedAll.map((g) => (
              <GuideCard
                key={g.id}
                guide={{
                  slug: g.slug,
                  title: g.title,
                  excerpt: g.excerpt,
                  ogImage: g.ogImage, heroImage: g.heroImage,
                  readingMinutes: g.readingMinutes,
                  viewsCount: g.stats?.viewsCount ?? 0,
                  publishedAt: g.publishedAt,
                  isPinned: true,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <p className="text-text-sub text-lg py-16 text-center">
          No guides yet. The latest ones will appear here.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((g) => (
            <GuideCard
              key={g.id}
              guide={{
                slug: g.slug,
                title: g.title,
                excerpt: g.excerpt,
                ogImage: g.ogImage, heroImage: g.heroImage,
                readingMinutes: g.readingMinutes,
                viewsCount: g.stats?.viewsCount ?? 0,
                publishedAt: g.publishedAt,
                isPinned: g.isPinned,
              }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm transition-colors ${
                p === page
                  ? 'bg-accent text-bg font-semibold'
                  : 'text-text-sub hover:text-text hover:bg-bg-card-hover border border-border'
              }`}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}

// Builds /guides[?topic=&sort=], omitting defaults (sort=popular, no topic).
function buildHref({ topic, sort }: { topic?: string; sort?: string }): string {
  const qs = new URLSearchParams()
  if (topic) qs.set('topic', topic)
  if (sort === 'new') qs.set('sort', 'new')
  const s = qs.toString()
  return s ? `${routes.guides()}?${s}` : routes.guides()
}

function SortTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active ? 'bg-text text-bg' : 'text-text-sub hover:text-text hover:bg-bg-card-hover'
      }`}
    >
      {label}
    </Link>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? 'bg-accent text-bg border-accent'
          : 'border-border text-text-sub hover:text-text hover:border-border-hover'
      }`}
    >
      {label}
    </Link>
  )
}
