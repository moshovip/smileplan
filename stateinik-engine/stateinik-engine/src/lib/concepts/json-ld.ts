// JSON-LD for a concept page: DefinedTerm inside a DefinedTermSet + BreadcrumbList.
// The concept graph targets a brand-only domain — point 8 of the plan's "Principles".

import { ORGANIZATION_ID } from '@/lib/organization/json-ld'
import { buildBreadcrumb } from '@/lib/seo/breadcrumb'
import { siteConfig, routes } from '@/site.config'

const APP_URL = siteConfig.url
const TERM_SET_ID = `${APP_URL}${routes.concepts()}#termset`

export interface ConceptJsonLdInput {
  slug: string
  term: string
  shortDefinition: string
  longExplanation?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
  publishedAt?: Date | null
  updatedAt: Date
  ogImage?: string | null
  authorSlug?: string | null
  authorName?: string | null
  relatedTerms?: Array<{ slug: string; term: string }>
}

export function buildConceptJsonLd(input: ConceptJsonLdInput) {
  const url = `${APP_URL}${routes.concept(input.slug)}`
  const ogImage = input.ogImage ?? `${APP_URL}/og/concept/${input.slug}`

  const breadcrumbs = [
    { name: 'Glossary', url: `${APP_URL}${routes.concepts()}` },
    { name: 'Concepts', url: `${APP_URL}${routes.concepts()}` },
    { name: input.term, url },
  ]

  const definedTerm = {
    '@type': 'DefinedTerm' as const,
    '@id': `${url}#term`,
    name: input.term,
    description: input.shortDefinition,
    url,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet' as const,
      '@id': TERM_SET_ID,
      name: `${siteConfig.name} glossary`,
      url: `${APP_URL}${routes.concepts()}`,
      publisher: { '@id': ORGANIZATION_ID },
    },
    ...(input.relatedTerms && input.relatedTerms.length
      ? {
          isRelatedTo: input.relatedTerms.map((r) => ({
            '@type': 'DefinedTerm' as const,
            '@id': `${APP_URL}${routes.concept(r.slug)}#term`,
            name: r.term,
            url: `${APP_URL}${routes.concept(r.slug)}`,
          })),
        }
      : {}),
  }

  const article = {
    '@type': 'Article' as const,
    '@id': `${url}#article`,
    headline: input.metaTitle ?? `${input.term} — ${siteConfig.name} glossary`,
    description: input.metaDescription ?? input.shortDefinition,
    image: [ogImage],
    datePublished: (input.publishedAt ?? input.updatedAt).toISOString(),
    dateModified: input.updatedAt.toISOString(),
    publisher: { '@id': ORGANIZATION_ID },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: siteConfig.defaultLocale,
    isAccessibleForFree: true,
    ...(input.authorSlug && input.authorName
      ? {
          author: {
            '@type': 'Person' as const,
            '@id': `${APP_URL}${routes.author(input.authorSlug)}#author`,
            name: input.authorName,
            url: `${APP_URL}${routes.author(input.authorSlug)}`,
          },
        }
      : { author: { '@id': ORGANIZATION_ID } }),
    about: { '@id': `${url}#term` },
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [definedTerm, article, buildBreadcrumb(breadcrumbs, url)],
  }
}
