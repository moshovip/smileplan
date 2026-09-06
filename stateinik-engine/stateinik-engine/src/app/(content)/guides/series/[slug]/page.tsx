import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

export const revalidate = 3600

const APP_URL = siteConfig.url

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const series = await prisma.guideSeries.findUnique({ where: { slug } })
  if (!series) return { title: `Series not found — ${siteConfig.name}` }
  return {
    title: `${series.title} — ${siteConfig.name} guide series`,
    description: series.description ?? `The “${series.title}” guide series.`,
    alternates: { canonical: routes.series(slug) },
    openGraph: {
      title: series.title,
      description: series.description ?? undefined,
      url: `${APP_URL}${routes.series(slug)}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

export default async function SeriesPage({ params }: PageProps) {
  const { slug } = await params
  const series = await prisma.guideSeries.findUnique({ where: { slug } })
  if (!series) notFound()

  const guides = await prisma.guide.findMany({
    where: { seriesId: series.id, status: 'published', deletedAt: null },
    orderBy: { seriesOrder: 'asc' },
    select: { slug: true, title: true, excerpt: true, readingMinutes: true, seriesOrder: true },
  })

  return (
    <div className="max-w-narrow mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">Series</p>
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">
          {series.title}
        </h1>
        {series.description && (
          <p className="mt-4 text-text-sub text-lg">{series.description}</p>
        )}
      </header>

      {guides.length === 0 ? (
        <p className="text-text-sub py-8">No published guides in this series yet.</p>
      ) : (
        <ol className="space-y-3">
          {guides.map((g, i) => (
            <li key={g.slug}>
              <Link
                href={routes.guide(g.slug)}
                className="group flex gap-4 rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-5"
              >
                <div className="shrink-0 font-head text-3xl text-accent w-10 text-center">
                  {g.seriesOrder ?? i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-semibold tracking-tight text-text group-hover:text-accent leading-snug">
                    {g.title}
                  </h3>
                  <p className="text-sm text-text-sub mt-1 line-clamp-2">{g.excerpt}</p>
                  {g.readingMinutes > 0 && (
                    <p className="text-xs text-text-dim mt-2 inline-flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.5} />
                      {g.readingMinutes} min
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
