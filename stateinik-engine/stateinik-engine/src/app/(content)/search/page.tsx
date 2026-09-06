import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'
import { toTsQuery } from '@/lib/guides/ts-query'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const APP_URL = siteConfig.url

interface PageProps {
  searchParams?: Promise<{ q?: string }>
}

interface SearchHit {
  id: string
  slug: string
  title: string
  excerpt: string
  rank: number
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {}
  const q = params.q?.trim() ?? ''
  const title = q ? `Search: ${q} — ${siteConfig.name}` : `Search — ${siteConfig.name}`
  return {
    title,
    description: `Search the guides on ${siteConfig.name}.`,
    alternates: { canonical: routes.search() },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      url: `${APP_URL}${routes.search()}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const rawQuery = params.q?.trim() ?? ''
  const tsQuery = toTsQuery(rawQuery)

  let results: SearchHit[] = []
  if (tsQuery) {
    // Full-text search over published guides. The FTS language must match the
    // dictionary used by the trigger in the *_fts migration (FTS_LANGUAGE).
    results = await prisma.$queryRaw<SearchHit[]>`
      SELECT id, slug, title, excerpt,
             ts_rank("contentTsv", to_tsquery(${siteConfig.ftsLanguage}::regconfig, ${tsQuery})) AS rank
      FROM "Guide"
      WHERE "contentTsv" @@ to_tsquery(${siteConfig.ftsLanguage}::regconfig, ${tsQuery})
        AND status = 'published'
        AND "deletedAt" IS NULL
      ORDER BY rank DESC
      LIMIT 50
    `
  }

  return (
    <div className="max-w-narrow mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">Search</h1>
      </header>

      <form action={routes.search()} method="get" className="mb-10">
        <label className="block">
          <span className="text-text-sub text-sm mb-2 block">Query</span>
          <input
            type="search"
            name="q"
            defaultValue={rawQuery}
            placeholder="Search guides…"
            className="w-full bg-bg-card border border-border rounded-lg px-4 py-3 text-text placeholder:text-text-dim focus:outline-none focus:border-accent transition-colors"
          />
        </label>
      </form>

      {!rawQuery && (
        <p className="text-text-sub text-lg py-12 text-center">Enter a query to search the guides.</p>
      )}

      {rawQuery && results.length === 0 && (
        <p className="text-text-sub text-lg py-12 text-center">Nothing found for “{rawQuery}”.</p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((r) => (
            <li key={r.id}>
              <Link
                href={routes.guide(r.slug)}
                className="group block rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-5"
              >
                <h3 className="text-[17px] font-semibold tracking-tight text-text group-hover:text-accent leading-snug mb-1">
                  {r.title}
                </h3>
                <p className="text-sm text-text-sub line-clamp-2">{r.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
