import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

// Index of live published rows — render at request time so `next build` /
// `docker build` never need a reachable database. Detail pages keep ISR.
export const dynamic = 'force-dynamic'

const APP_URL = siteConfig.url

export const metadata: Metadata = {
  title: `Glossary — ${siteConfig.name}`,
  description: 'A glossary: key terms explained in plain language with practical examples.',
  alternates: { canonical: routes.concepts() },
  openGraph: {
    title: `Glossary — ${siteConfig.name}`,
    description: 'A glossary of key terms.',
    url: `${APP_URL}${routes.concepts()}`,
    siteName: siteConfig.name,
    type: 'website',
  },
}

export default async function ConceptsIndexPage() {
  const concepts = await prisma.concept.findMany({
    where: { status: 'published', deletedAt: null },
    orderBy: { term: 'asc' },
    select: { slug: true, term: true, shortDefinition: true },
  })

  // Group by first letter.
  const groups = new Map<string, typeof concepts>()
  for (const c of concepts) {
    const letter = c.term.slice(0, 1).toUpperCase()
    const list = groups.get(letter) ?? []
    list.push(c)
    groups.set(letter, list)
  }
  const letters = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b))

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">
          Glossary
        </h1>
        <p className="mt-4 text-text-sub text-lg max-w-narrow">
          Key terms explained in plain language and in the context of practice.
        </p>
      </header>

      {letters.length === 0 ? (
        <p className="text-text-sub text-lg py-16 text-center">Concepts will appear here.</p>
      ) : (
        <>
          <nav aria-label="Alphabet" className="flex flex-wrap gap-1.5 mb-8">
            {letters.map((l) => (
              <a
                key={l}
                href={`#letter-${l}`}
                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border text-text-sub hover:text-accent hover:border-accent transition-colors text-sm font-medium"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="space-y-10">
            {letters.map((l) => (
              <section key={l} id={`letter-${l}`}>
                <h2 className="font-head text-3xl text-accent mb-4">{l}</h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(groups.get(l) ?? []).map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={routes.concept(c.slug)}
                        className="block rounded-2xl border border-border bg-bg-card hover:border-accent transition-colors p-4 group"
                      >
                        <h3 className="text-base font-semibold tracking-tight text-text group-hover:text-accent">{c.term}</h3>
                        <p className="text-sm text-text-sub mt-1 line-clamp-2">{c.shortDefinition}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
