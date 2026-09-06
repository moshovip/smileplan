// /llms-full.txt — a full dump of published content for LLM crawlers that want
// the source text, not just an index. Capped at 5 MB; truncated with a note.

import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const APP_URL = siteConfig.url
const MAX_BYTES = 5 * 1024 * 1024

function stripFrontmatter(source: string): string {
  return source.replace(/^---\n[\s\S]*?\n---\n/, '')
}

export async function GET() {
  const [guides, concepts] = await Promise.all([
    prisma.guide.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      select: { slug: true, title: true, excerpt: true, content: true, metaDescription: true, updatedAt: true },
    }),
    siteConfig.hasConcepts
      ? prisma.concept.findMany({
          where: { status: 'published', deletedAt: null },
          orderBy: { term: 'asc' },
          select: { slug: true, term: true, shortDefinition: true, longExplanation: true, updatedAt: true },
        })
      : Promise.resolve([] as Array<{ slug: string; term: string; shortDefinition: string; longExplanation: string | null; updatedAt: Date }>),
  ])

  const chunks: string[] = []
  chunks.push(`# ${siteConfig.name} — full content`)
  chunks.push('')
  chunks.push(`URL: ${APP_URL}`)
  chunks.push(`> ${siteConfig.description}`)
  chunks.push('')

  let truncated = false
  let bytes = Buffer.byteLength(chunks.join('\n'), 'utf-8')

  function push(section: string): boolean {
    const size = Buffer.byteLength(section, 'utf-8')
    if (bytes + size > MAX_BYTES) {
      truncated = true
      return false
    }
    chunks.push(section)
    bytes += size + 1
    return true
  }

  function finalize() {
    if (truncated) {
      chunks.push('', '> (truncated — exceeded the 5 MB limit. Full URL list is in /llms.txt and /sitemap.xml)')
    }
    return new Response(chunks.join('\n'), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  }

  if (guides.length > 0) {
    if (!push('---')) return finalize()
    if (!push('## Guides')) return finalize()
    for (const g of guides) {
      const section = [
        '',
        `### ${g.title}`,
        `URL: ${APP_URL}${routes.guide(g.slug)}`,
        `Updated: ${g.updatedAt.toISOString()}`,
        '',
        g.metaDescription || g.excerpt,
        '',
        stripFrontmatter(g.content),
        '',
      ].join('\n')
      if (!push(section)) break
    }
  }

  if (!truncated && concepts.length > 0) {
    if (!push('---')) return finalize()
    if (!push('## Glossary')) return finalize()
    for (const c of concepts) {
      const section = [
        '',
        `### ${c.term}`,
        `URL: ${APP_URL}${routes.concept(c.slug)}`,
        `Updated: ${c.updatedAt.toISOString()}`,
        '',
        c.shortDefinition,
        ...(c.longExplanation ? ['', stripFrontmatter(c.longExplanation)] : []),
        '',
      ].join('\n')
      if (!push(section)) break
    }
  }

  return finalize()
}
