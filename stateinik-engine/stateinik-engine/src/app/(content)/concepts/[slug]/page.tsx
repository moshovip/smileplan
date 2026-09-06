import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

import { prisma } from '@/lib/prisma'
import { jsonLdScript } from '@/lib/seo/json-ld-script'
import { siteConfig, routes } from '@/site.config'
import { renderMdx } from '@/lib/mdx/render'
import { findConceptRedirectSlug } from '@/lib/guides/queries'
import { buildConceptJsonLd } from '@/lib/concepts/json-ld'
import { getRelatedConcepts, getGuidesMentioningConcept } from '@/lib/concepts/related'

import { RelatedConcepts } from '@/components/mdx-blocks/RelatedConcepts'
import { RelatedGuides } from '@/components/mdx-blocks/RelatedGuides'

export const revalidate = 3600

const APP_URL = siteConfig.url

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const concept = await prisma.concept.findUnique({
    where: { slug },
    select: { term: true, shortDefinition: true, metaTitle: true, metaDescription: true, ogImage: true, status: true },
  })
  if (!concept || concept.status !== 'published') {
    return { title: `Concept not found — ${siteConfig.name}` }
  }
  const title = concept.metaTitle ?? `${concept.term} — ${siteConfig.name} glossary`
  const description = concept.metaDescription || concept.shortDefinition || concept.term
  const ogImageUrl = concept.ogImage ?? `${APP_URL}/og/concept/${slug}`
  return {
    title,
    description,
    alternates: { canonical: routes.concept(slug) },
    openGraph: {
      title,
      description,
      url: `${APP_URL}${routes.concept(slug)}`,
      siteName: siteConfig.name,
      type: 'article',
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  }
}

export default async function ConceptPage({ params }: PageProps) {
  const { slug } = await params

  const concept = await prisma.concept.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, slug: true } },
    },
  })

  if (!concept || concept.status !== 'published' || concept.deletedAt) {
    const newSlug = await findConceptRedirectSlug(slug)
    if (newSlug && newSlug !== slug) permanentRedirect(routes.concept(newSlug))
    notFound()
  }

  const rendered = concept.longExplanation
    ? await renderMdx(concept.longExplanation, { context: 'concept' })
    : null

  const [relatedConcepts, guidesMentioning] = await Promise.all([
    getRelatedConcepts(concept.id, 6),
    getGuidesMentioningConcept(concept.id, 10),
  ])

  const jsonLdGraph = buildConceptJsonLd({
    slug: concept.slug,
    term: concept.term,
    shortDefinition: concept.shortDefinition,
    longExplanation: concept.longExplanation,
    metaTitle: concept.metaTitle,
    metaDescription: concept.metaDescription,
    publishedAt: concept.publishedAt,
    updatedAt: concept.updatedAt,
    ogImage: concept.ogImage,
    authorSlug: concept.author?.slug ?? null,
    authorName: concept.author?.name ?? null,
    relatedTerms: relatedConcepts.map((r) => ({
      slug: r.slug,
      term: r.term,
    })),
  })

  return (
    <div className="max-w-narrow mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdGraph) }}
      />
      <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-text-dim mb-6">
        <Link href={routes.concepts()} className="hover:text-accent">Glossary</Link>
        <ChevronRight size={12} strokeWidth={1.5} />
        <span className="text-text-sub truncate">{concept.term}</span>
      </nav>

      <header className="mb-8">
        <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">Concept</p>
        <h1 className="font-head text-[clamp(32px,4.5vw,48px)] text-text leading-[1.1] tracking-tight mb-4">
          {concept.term}
        </h1>
        <p className="text-text-sub text-xl leading-relaxed">{concept.shortDefinition}</p>
      </header>

      {rendered && (
        <article className="prose prose-invert max-w-none prose-p:text-text prose-p:text-[17px] prose-p:leading-[1.7] prose-a:text-accent prose-strong:text-text">
          {rendered.content}
        </article>
      )}

      {relatedConcepts.length > 0 && (
        <RelatedConcepts concepts={relatedConcepts} title="Related concepts" />
      )}

      {guidesMentioning.length > 0 && (
        <RelatedGuides
          guides={guidesMentioning.map((g) => ({
            slug: g.slug,
            title: g.title,
            excerpt: g.excerpt,
            readingMinutes: g.readingMinutes,
          }))}
          title="Guides mentioning this concept"
        />
      )}
    </div>
  )
}
