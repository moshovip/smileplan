import type { Prisma } from '@prisma/client'
import { buildMdxMask, isInsideMask } from '../mdx/mask'

// Extract the slug from <DefinitionLink slug="..."> and <DefinitionLink slug="..." />.
// Don't reuse a /g regex literal across calls: build it inside the function.
function makeDefinitionLinkRe() {
  return /<DefinitionLink\b[^>]*?\bslug="([^"]+)"[^>]*?(?:\/>|>)/g
}

// DoS protection: even a megabyte-sized guide won't write more than MAX_SLUGS_PER_GUIDE
// unique slugs to the DB. In practice guides contain ≤ 50 DefinitionLinks.
const MAX_SLUGS_PER_GUIDE = 500

export function extractConceptSlugsFromMdx(content: string): string[] {
  if (!content) return []
  const spans = buildMdxMask(content, ['code-fence', 'inline-code'])
  const slugs = new Set<string>()
  const re = makeDefinitionLinkRe()
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    if (isInsideMask(spans, m.index, m[0].length)) continue
    const slug = m[1]
    if (slug) {
      slugs.add(slug)
      if (slugs.size >= MAX_SLUGS_PER_GUIDE) break
    }
  }
  return Array.from(slugs)
}

export interface SyncResult {
  added: string[]
  removed: string[]
  unknown: string[]
  finalSlugs: string[]
}

export async function syncGuideConceptMentions(
  guideId: string,
  content: string,
  tx: Prisma.TransactionClient,
): Promise<SyncResult> {
  const slugs = extractConceptSlugsFromMdx(content)

  const existing = await tx.guideConceptMention.findMany({
    where: { guideId },
    select: { concept: { select: { slug: true } } },
  })
  const existingSlugs = new Set(existing.map(e => e.concept.slug))

  let resolved: { id: string; slug: string }[] = []
  if (slugs.length) {
    resolved = await tx.concept.findMany({
      where: { slug: { in: slugs }, deletedAt: null },
      select: { id: true, slug: true },
    })
  }
  const resolvedSlugs = new Set(resolved.map(c => c.slug))
  const unknown = slugs.filter(s => !resolvedSlugs.has(s))
  if (unknown.length) {
    console.warn('[syncGuideConceptMentions] unknown slugs', { guideId, unknown })
  }

  await tx.guideConceptMention.deleteMany({ where: { guideId } })
  if (resolved.length) {
    await tx.guideConceptMention.createMany({
      data: resolved.map(c => ({ guideId, conceptId: c.id })),
      skipDuplicates: true,
    })
  }

  const added = Array.from(resolvedSlugs).filter(s => !existingSlugs.has(s))
  const removed = Array.from(existingSlugs).filter(s => !resolvedSlugs.has(s))
  return {
    added,
    removed,
    unknown,
    finalSlugs: Array.from(resolvedSlugs),
  }
}
