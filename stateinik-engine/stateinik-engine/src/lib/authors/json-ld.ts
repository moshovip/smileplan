// Person JSON-LD for an author page (/authors/[slug]).
// `knowsAbout` is derived from the topics of the author's guides — it broadens
// topical authority. `sameAs` comes from Author.socialLinks.

import { ORGANIZATION_ID } from '@/lib/organization/json-ld'
import { siteConfig, routes } from '@/site.config'

const APP_URL = siteConfig.url

export interface AuthorJsonLdInput {
  slug: string
  name?: string | null
  title?: string | null
  bio?: string | null
  avatar?: string | null
  /** Array of { label, url } from Author.socialLinks (Json). */
  socialLinks?: Array<{ url?: string }> | unknown | null
  knowsAbout?: string[]
}

export function buildAuthorJsonLd(author: AuthorJsonLdInput) {
  const url = `${APP_URL}${routes.author(author.slug)}`
  const id = `${url}#author`

  const sameAs: string[] = []
  if (Array.isArray(author.socialLinks)) {
    for (const link of author.socialLinks) {
      const value = (link as { url?: string })?.url
      if (typeof value === 'string' && /^https?:\/\//.test(value)) sameAs.push(value)
    }
  }

  const knowsAbout = (author.knowsAbout ?? []).filter(Boolean)

  return {
    '@type': 'Person' as const,
    '@id': id,
    name: author.name ?? 'Author',
    ...(author.title ? { jobTitle: author.title } : {}),
    ...(author.bio ? { description: author.bio } : {}),
    ...(author.avatar
      ? {
          image: author.avatar.startsWith('http')
            ? author.avatar
            : `${APP_URL}${author.avatar}`,
        }
      : {}),
    url,
    worksFor: { '@id': ORGANIZATION_ID },
    ...(knowsAbout.length ? { knowsAbout } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }
}
