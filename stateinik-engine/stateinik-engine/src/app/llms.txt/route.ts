// /llms.txt — a compact index of the site for LLM crawlers.
// Format: https://llmstxt.org

import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const APP_URL = siteConfig.url

function escapeMd(s: string): string {
  return s.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function GET() {
  const [guides, concepts] = await Promise.all([
    prisma.guide.findMany({
      where: { status: 'published', deletedAt: null },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      select: { slug: true, title: true, excerpt: true },
    }),
    siteConfig.hasConcepts
      ? prisma.concept.findMany({
          where: { status: 'published', deletedAt: null },
          orderBy: { term: 'asc' },
          select: { slug: true, term: true, shortDefinition: true },
        })
      : Promise.resolve([] as Array<{ slug: string; term: string; shortDefinition: string }>),
  ])

  const lines: string[] = []
  lines.push(`# ${siteConfig.name}`)
  lines.push('')
  lines.push(`> ${siteConfig.description}`)
  lines.push('')
  lines.push(`URL: ${APP_URL}`)
  lines.push('')

  if (guides.length > 0) {
    lines.push('## Guides')
    lines.push('')
    for (const g of guides) {
      lines.push(`- [${escapeMd(g.title)}](${APP_URL}${routes.guide(g.slug)}): ${escapeMd(g.excerpt)}`)
    }
    lines.push('')
  }

  if (concepts.length > 0) {
    lines.push('## Glossary')
    lines.push('')
    for (const c of concepts) {
      lines.push(`- [${escapeMd(c.term)}](${APP_URL}${routes.concept(c.slug)}): ${escapeMd(c.shortDefinition)}`)
    }
    lines.push('')
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
