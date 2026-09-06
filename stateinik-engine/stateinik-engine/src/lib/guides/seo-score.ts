import { extractMdxMeta } from '@/lib/mdx/extract'

export interface SeoCheckInput {
  title: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  targetKeyword: string
  content: string
}

export interface SeoCheck {
  id: string
  label: string
  status: 'pass' | 'warn' | 'fail'
  detail?: string
  weight: number
}

export interface SeoScoreResult {
  score: number
  maxScore: number
  checks: SeoCheck[]
  keywordDensity: number
  metaTitleLength: number
  metaDescriptionLength: number
  excerptLength: number
}

const STOP_WORDS = new Set([
  'и', 'в', 'на', 'не', 'с', 'по', 'для', 'от', 'к', 'у', 'из', 'за', 'до', 'о',
  'что', 'это', 'как', 'или', 'но', 'а', 'же', 'бы', 'ли', 'все', 'вот', 'ещё',
  'был', 'была', 'было', 'были', 'есть', 'нет', 'да', 'я', 'ты', 'он', 'она',
  'мы', 'вы', 'они', 'себя', 'свой', 'свою', 'свои', 'мой', 'твой', 'наш',
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for',
])

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/

function stripFrontmatter(s: string): string {
  return s.replace(FRONTMATTER_RE, '')
}

function stripMdxNoise(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>]/g, ' ')
}

function tokenize(s: string): string[] {
  return stripMdxNoise(s)
    .toLowerCase()
    .split(/[^a-zа-яё0-9-]+/i)
    .filter(w => w && w.length > 1 && !STOP_WORDS.has(w))
}

function countKeywordHits(text: string, keyword: string): number {
  if (!keyword.trim()) return 0
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(^|[^a-zа-яё0-9])(${escaped})(?=$|[^a-zа-яё0-9])`, 'gi')
  return (text.match(re) ?? []).length
}

export function calculateSeoScore(input: SeoCheckInput): SeoScoreResult {
  const stripped = stripFrontmatter(input.content)
  const plain = stripMdxNoise(stripped).replace(/\s+/g, ' ').trim()
  const words = tokenize(plain)
  const wordCount = words.length

  const keyword = input.targetKeyword.trim().toLowerCase()
  const hasKeyword = keyword.length > 0

  const keywordHits = hasKeyword
    ? countKeywordHits(plain.toLowerCase(), keyword)
    : 0
  const keywordDensity =
    hasKeyword && wordCount > 0 ? (keywordHits / wordCount) * 100 : 0

  const meta = extractMdxMeta(input.content)

  const checks: SeoCheck[] = []

  // 1. metaTitle length
  const mtLen = input.metaTitle.length
  checks.push({
    id: 'meta-title-length',
    label: 'Meta title length 50-60 characters',
    status: mtLen >= 50 && mtLen <= 60 ? 'pass' : mtLen >= 40 && mtLen <= 70 ? 'warn' : 'fail',
    detail: `${mtLen} characters`,
    weight: 8,
  })

  // 2. metaDescription length
  const mdLen = input.metaDescription.length
  checks.push({
    id: 'meta-desc-length',
    label: 'Meta description length 140-160 characters',
    status: mdLen >= 140 && mdLen <= 160 ? 'pass' : mdLen >= 120 && mdLen <= 180 ? 'warn' : 'fail',
    detail: `${mdLen} characters`,
    weight: 8,
  })

  // 3. excerpt length
  const exLen = input.excerpt.length
  checks.push({
    id: 'excerpt-length',
    label: 'Excerpt length 200-300 characters',
    status: exLen >= 200 && exLen <= 300 ? 'pass' : exLen >= 150 && exLen <= 400 ? 'warn' : 'fail',
    detail: `${exLen} characters`,
    weight: 5,
  })

  // 4. Keyword density 0.5%-1.5%
  if (hasKeyword) {
    const density = keywordDensity
    checks.push({
      id: 'keyword-density',
      label: 'Target keyword density 0.5-1.5%',
      status:
        density >= 0.5 && density <= 1.5
          ? 'pass'
          : density >= 0.2 && density <= 3
            ? 'warn'
            : 'fail',
      detail: `${density.toFixed(2)}% (${keywordHits} occurrences in ${wordCount} words)`,
      weight: 12,
    })
  } else {
    checks.push({
      id: 'keyword-density',
      label: 'Target keyword specified',
      status: 'fail',
      detail: 'Not set',
      weight: 12,
    })
  }

  // 5. keyword in title (H1)
  if (hasKeyword) {
    const inTitle = countKeywordHits(input.title.toLowerCase(), keyword) > 0
    checks.push({
      id: 'kw-in-h1',
      label: 'Target keyword in heading (H1)',
      status: inTitle ? 'pass' : 'fail',
      weight: 10,
    })
  }

  // 6. keyword in metaTitle
  if (hasKeyword) {
    const inMeta = countKeywordHits(input.metaTitle.toLowerCase(), keyword) > 0
    checks.push({
      id: 'kw-in-meta-title',
      label: 'Target keyword in meta title',
      status: inMeta ? 'pass' : 'fail',
      weight: 6,
    })
  }

  // 7. keyword in metaDescription
  if (hasKeyword) {
    const inMd = countKeywordHits(input.metaDescription.toLowerCase(), keyword) > 0
    checks.push({
      id: 'kw-in-meta-desc',
      label: 'Target keyword in meta description',
      status: inMd ? 'pass' : 'fail',
      weight: 6,
    })
  }

  // 8. keyword in the first paragraph (first 100 words)
  if (hasKeyword) {
    const first100 = words.slice(0, 100).join(' ')
    const inFirst = countKeywordHits(first100, keyword) > 0
    checks.push({
      id: 'kw-in-first-paragraph',
      label: 'Target keyword in the first 100 words',
      status: inFirst ? 'pass' : 'fail',
      weight: 6,
    })
  }

  // 9. keyword in the first H2
  if (hasKeyword) {
    const firstH2 = meta.toc.find(t => t.level === 2)
    const inH2 = firstH2 ? countKeywordHits(firstH2.text.toLowerCase(), keyword) > 0 : false
    checks.push({
      id: 'kw-in-h2',
      label: 'Target keyword in the first H2',
      status: inH2 ? 'pass' : firstH2 ? 'warn' : 'fail',
      detail: firstH2 ? undefined : 'No H2 headings found',
      weight: 5,
    })
  }

  // 10. Internal links >= 3
  const internalLinks = (stripped.match(/\]\((\/(?:guides|promty|koncept)\/[^)]+)\)/g) ?? []).length
  checks.push({
    id: 'internal-links',
    label: 'Internal links ≥ 3 (to guides/prompts/concepts)',
    status: internalLinks >= 3 ? 'pass' : internalLinks >= 1 ? 'warn' : 'fail',
    detail: `${internalLinks} links`,
    weight: 7,
  })

  // 11. All images have alt text
  const allImagesHaveAlt = meta.images.every(img => img.alt && img.alt.trim().length > 0)
  checks.push({
    id: 'images-alt',
    label: 'All images have alt text',
    status: meta.images.length === 0 ? 'warn' : allImagesHaveAlt ? 'pass' : 'fail',
    detail: meta.images.length === 0 ? 'No images' : undefined,
    weight: 5,
  })

  // 12. TldrSection at the start of every H2 (rough heuristic)
  const tldrInH2 = checkTldrAfterH2(stripped)
  checks.push({
    id: 'tldr-in-h2',
    label: 'TL;DR at the start of every H2',
    status: tldrInH2.allCovered ? 'pass' : tldrInH2.coverage >= 0.5 ? 'warn' : 'fail',
    detail: `${tldrInH2.covered}/${tldrInH2.total} H2 sections with TL;DR`,
    weight: 8,
  })

  // 13. Sources block
  const hasSources = /<Sources(?:\s|>)/.test(stripped)
  checks.push({
    id: 'sources',
    label: 'Sources block present',
    status: hasSources ? 'pass' : 'fail',
    weight: 6,
  })

  // 14. VideoEmbed (recommended)
  const hasVideo = meta.videos.length > 0
  checks.push({
    id: 'video-embed',
    label: 'VideoEmbed embedded (recommended)',
    status: hasVideo ? 'pass' : 'warn',
    weight: 3,
  })

  // 15. At least one DefinitionLink
  const hasDefLink = meta.mentionedConcepts.length > 0
  checks.push({
    id: 'definition-link',
    label: 'At least one DefinitionLink to a glossary term',
    status: hasDefLink ? 'pass' : 'warn',
    weight: 5,
  })

  const maxScore = checks.reduce((sum, c) => sum + c.weight, 0)
  const score = checks.reduce((sum, c) => {
    if (c.status === 'pass') return sum + c.weight
    if (c.status === 'warn') return sum + c.weight * 0.5
    return sum
  }, 0)

  return {
    score: Math.round((score / maxScore) * 100),
    maxScore: 100,
    checks,
    keywordDensity,
    metaTitleLength: mtLen,
    metaDescriptionLength: mdLen,
    excerptLength: exLen,
  }
}

function checkTldrAfterH2(content: string): { total: number; covered: number; coverage: number; allCovered: boolean } {
  const lines = content.split('\n')
  let total = 0
  let covered = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!/^##\s+/.test(line) || /^###/.test(line)) continue
    total += 1
    for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
      const next = lines[j].trim()
      if (!next) continue
      if (/^<TldrSection/.test(next)) {
        covered += 1
      }
      break
    }
  }
  return {
    total,
    covered,
    coverage: total === 0 ? 0 : covered / total,
    allCovered: total > 0 && covered === total,
  }
}
