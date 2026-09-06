import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import type { Prisma, GuideStatus, GuideType } from '@prisma/client'

export const metadata = {
  title: 'Guides — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<GuideStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'bg-white/5 text-text-sub' },
  scheduled: { label: 'Scheduled', cls: 'bg-amber-500/15 text-amber-300' },
  published: { label: 'Published', cls: 'bg-emerald-500/15 text-emerald-300' },
  archived: { label: 'Archived', cls: 'bg-white/5 text-text-dim line-through' },
}

const TYPE_LABELS: Record<GuideType, string> = {
  pillar: 'Pillar',
  tutorial: 'Tutorial',
  playbook: 'Playbook',
  recipe: 'Recipe',
}

interface SearchParams {
  status?: string
  author?: string
  topic?: string
  type?: string
  filter?: string
  q?: string
}

interface Props {
  searchParams: Promise<SearchParams>
}

const STALE_DAYS = 90

export default async function AdminGuidesPage({ searchParams }: Props) {
  const sp = await searchParams
  const where: Prisma.GuideWhereInput = { deletedAt: null }
  if (sp.status && (sp.status as GuideStatus) in STATUS_LABELS) {
    where.status = sp.status as GuideStatus
  }
  if (sp.author) where.authorId = sp.author
  if (sp.topic) where.topics = { some: { topicId: sp.topic } }
  if (sp.type && (sp.type as GuideType) in TYPE_LABELS) where.type = sp.type as GuideType
  if (sp.q) where.title = { contains: sp.q, mode: 'insensitive' }

  const staleCutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000)
  if (sp.filter === 'stale') {
    where.status = 'published'
    where.updatedAt = { lt: staleCutoff }
    where.OR = [{ lastReviewedAt: null }, { lastReviewedAt: { lt: staleCutoff } }]
  }

  const [guides, authors, topics] = await Promise.all([
    prisma.guide.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
        topics: { include: { topic: { select: { slug: true, title: true } } } },
        stats: true,
        brokenLinks: {
          select: { url: true, statusCode: true, errorMessage: true },
          orderBy: { lastCheckedAt: 'desc' },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 200,
    }),
    prisma.author.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.topic.findMany({ select: { id: true, slug: true, title: true }, orderBy: { title: 'asc' } }),
  ])

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-head text-[28px] text-text">Guides</h1>
          <p className="text-text-dim text-[13px] mt-1">
            {guides.length} guides · filtered by current parameters
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/guides/new"
            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl text-[14px] font-medium"
          >
            New guide
          </Link>
        </div>
      </div>

      <form className="bg-bg-card border border-border rounded-2xl p-4 mb-5 grid grid-cols-2 md:grid-cols-5 gap-3">
        <input
          name="q"
          type="text"
          placeholder="Search by title"
          defaultValue={sp.q ?? ''}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text"
        />
        <select
          name="status"
          defaultValue={sp.status ?? ''}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={sp.type ?? ''}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          name="author"
          defaultValue={sp.author ?? ''}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text"
        >
          <option value="">All authors</option>
          {authors.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          name="topic"
          defaultValue={sp.topic ?? ''}
          className="bg-bg border border-border rounded-xl px-3 py-2 text-[13px] text-text"
        >
          <option value="">All topics</option>
          {topics.map(t => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <div className="col-span-2 md:col-span-5 flex gap-2 items-center">
          <button
            type="submit"
            className="bg-white/10 hover:bg-white/15 text-text px-4 py-2 rounded-xl text-[13px]"
          >
            Apply
          </button>
          <Link
            href="/admin/guides"
            className="text-text-dim hover:text-text px-4 py-2 rounded-xl text-[13px]"
          >
            Reset
          </Link>
          <Link
            href="/admin/guides?filter=stale"
            className={`px-3 py-2 rounded-xl text-[12px] ${sp.filter === 'stale' ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-500/10 text-amber-300/80 hover:bg-amber-500/15'}`}
            title={`Published >${STALE_DAYS} days without an update or review`}
          >
            Stale
          </Link>
        </div>
      </form>

      {guides.length === 0 ? (
        <div className="bg-bg-card border border-border rounded-2xl p-8 text-text-dim text-center">
          No guides yet. Create the first one with the “New guide” button above.
        </div>
      ) : (
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-text-dim text-[11px] uppercase tracking-[0.1em]">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-3 py-3">Author</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Topics</th>
                  <th className="px-3 py-3 text-right">Min</th>
                  <th className="px-3 py-3 text-right">Views</th>
                  <th className="px-3 py-3 text-right">Apply</th>
                  <th className="px-3 py-3 text-right">Share</th>
                  <th className="px-3 py-3 text-right">CTA</th>
                  <th
                    className="px-3 py-3 text-right"
                    title="Pogo-sticking rate: share of search visits that bounce in under 30s with scroll < 25%"
                  >
                    Pogo
                  </th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {guides.map(g => {
                  const authorName = g.author.name || '—'
                  const st = STATUS_LABELS[g.status]
                  const views = g.stats?.viewsCount ?? 0
                  const pogo = g.stats?.pogoStickCount ?? 0
                  const pogoRate = views > 0 ? (pogo / views) * 100 : null
                  const pogoCls =
                    pogoRate === null
                      ? 'text-text-dim'
                      : pogoRate < 30
                        ? 'text-emerald-300'
                        : pogoRate < 60
                          ? 'text-amber-300'
                          : 'text-red-300'
                  const isStale =
                    g.status === 'published' &&
                    g.updatedAt < staleCutoff &&
                    (!g.lastReviewedAt || g.lastReviewedAt < staleCutoff)
                  const brokenCount = g.brokenLinks.length
                  const brokenTooltip =
                    brokenCount > 0
                      ? g.brokenLinks
                          .slice(0, 10)
                          .map(b => `${b.statusCode ?? b.errorMessage ?? '?'} → ${b.url}`)
                          .join('\n')
                      : ''
                  return (
                    <tr key={g.id} className="border-b border-border last:border-0 hover:bg-bg-card-hover">
                      <td className="px-4 py-3 max-w-[300px]">
                        <Link
                          href={`/admin/guides/${g.id}`}
                          className="text-text hover:text-accent line-clamp-2"
                          title={g.title}
                        >
                          {g.title}
                        </Link>
                        <div className="text-text-dim text-[11px] mt-0.5 font-mono">
                          /{g.slug}
                        </div>
                        {(isStale || brokenCount > 0) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {isStale && (
                              <span
                                className="bg-amber-500/15 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full"
                                title={`Not updated or reviewed for >${STALE_DAYS} days`}
                              >
                                Stale
                              </span>
                            )}
                            {brokenCount > 0 && (
                              <span
                                className="bg-red-500/15 text-red-300 text-[10px] px-1.5 py-0.5 rounded-full"
                                title={brokenTooltip}
                              >
                                Broken links: {brokenCount}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-text-sub">{authorName}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-1 rounded-full text-[11px] ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.topics.slice(0, 2).map(gt => (
                            <span
                              key={gt.topic.slug}
                              className="bg-white/5 text-text-sub text-[11px] px-2 py-0.5 rounded-full"
                            >
                              {gt.topic.title}
                            </span>
                          ))}
                          {g.topics.length > 2 && (
                            <span className="text-text-dim text-[11px]">+{g.topics.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-text-sub">{g.readingMinutes || '—'}</td>
                      <td className="px-3 py-3 text-right text-text-sub">{g.stats?.viewsCount ?? 0}</td>
                      <td className="px-3 py-3 text-right text-text-sub">{g.stats?.appliedCount ?? 0}</td>
                      <td className="px-3 py-3 text-right text-text-sub">{g.stats?.shareCount ?? 0}</td>
                      <td className="px-3 py-3 text-right text-text-sub">{g.stats?.ctaClickCount ?? 0}</td>
                      <td
                        className={`px-3 py-3 text-right ${pogoCls}`}
                        title={
                          pogoRate === null
                            ? 'No data'
                            : `${pogo} pogo-stick out of ${views} views`
                        }
                      >
                        {pogoRate === null ? '—' : `${pogoRate.toFixed(0)}%`}
                      </td>
                      <td className="px-3 py-3 text-text-dim text-[12px]">
                        {g.updatedAt.toLocaleDateString('en-US')}
                      </td>
                      <td className="px-3 py-3 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/guides/${g.id}`}
                          className="text-accent hover:text-accent-hover text-[12px] mr-3"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/guides/${g.id}/preview`}
                          className="text-text-sub hover:text-text text-[12px] mr-3"
                        >
                          Preview
                        </Link>
                        <Link
                          href={`/admin/guides/${g.id}/revisions`}
                          className="text-text-sub hover:text-text text-[12px]"
                        >
                          Revisions
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
