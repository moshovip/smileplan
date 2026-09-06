import { extractMdxMeta } from '@/lib/mdx/extract'
import { hasJsxCodeBlock } from '@/lib/mdx/normalize-code-blocks'
import { siteConfig } from '@/site.config'

// Structural quality gate run before publishing. These checks are universal
// (single H1, alt text, internal links, TL;DR coverage, quote attribution, …).
// Language- or brand-specific lexical rules (e.g. banned words) are intentionally
// NOT here — ship those as an optional rule-pack if you need them.

export type CheckStatus = 'pass' | 'fail' | 'manual'

export interface AntiAiCheck {
  id: string
  label: string
  status: CheckStatus
  details?: string[]
  /** If true, this check is automated and blocks publishing on fail. */
  automated: boolean
}

export interface AntiAiCheckInput {
  title: string
  content: string
  metaTitle: string
  metaDescription: string
  excerpt: string
  heroPromise?: unknown
  primaryCta?: unknown
  authorId?: string | null
}

export interface AntiAiCheckResult {
  checks: AntiAiCheck[]
  canPublish: boolean
}

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/

function stripFrontmatter(s: string): string {
  return s.replace(FRONTMATTER_RE, '')
}

function stripCodeBlocks(s: string): string {
  return s.replace(/<CodeBlock\b[\s\S]*?<\/CodeBlock>/g, '').replace(/```[\s\S]*?```/g, '')
}

function extractQuoteBodies(content: string): string[] {
  const bodies: string[] = []
  const re = /<Quote\b[^>]*>([\s\S]*?)<\/Quote>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) bodies.push(m[1])
  return bodies
}

function findDuplicateQuotes(content: string): string[] {
  const counts = new Map<string, number>()
  for (const body of extractQuoteBodies(content)) {
    const key = body.replace(/\s+/g, ' ').trim()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const dups: string[] = []
  counts.forEach((n, key) => {
    if (n >= 2) dups.push(`x${n}: ${key.slice(0, 100)}`)
  })
  return dups
}

function checkTldrAfterH2(content: string): { total: number; covered: number; allCovered: boolean } {
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
      if (/^<TldrSection/.test(next)) covered += 1
      break
    }
  }
  return { total, covered, allCovered: total > 0 && covered === total }
}

export function runAntiAiChecks(input: AntiAiCheckInput): AntiAiCheckResult {
  const stripped = stripFrontmatter(input.content)
  const checks: AntiAiCheck[] = []

  // 1. Single H1 (the title is the H1).
  const h1Count = (stripCodeBlocks(stripped).match(/^#\s+/gm) ?? []).length
  checks.push({
    id: 'single-h1',
    label: 'Exactly one H1 (the title); content has 0–1 lines starting with "# "',
    status: h1Count <= 1 ? 'pass' : 'fail',
    details: h1Count > 1 ? [`Found ${h1Count} lines starting with "# "`] : undefined,
    automated: true,
  })

  // 2. Images have alt text.
  const meta = extractMdxMeta(input.content)
  const noAlt = meta.images.filter((img) => !img.alt || img.alt.trim().length === 0).map((img) => img.url)
  checks.push({
    id: 'images-alt',
    label: 'Every image has meaningful alt text',
    status: noAlt.length === 0 ? 'pass' : 'fail',
    details: noAlt.length ? noAlt : undefined,
    automated: true,
  })

  // 3. At least 3 internal links (to guides/concepts).
  const prefixes = [siteConfig.routePrefix.guides, siteConfig.routePrefix.concepts]
    .map((p) => p.replace(/^\//, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const internalLinks = (stripped.match(new RegExp(`\\]\\((/(?:${prefixes})/[^)]+)\\)`, 'g')) ?? []).length
  checks.push({
    id: 'internal-links',
    label: 'At least 3 internal links',
    status: internalLinks >= 3 ? 'pass' : 'fail',
    details: [`${internalLinks} link(s)`],
    automated: true,
  })

  // 4. TL;DR (TldrSection) at the start of each H2.
  const tldrCheck = checkTldrAfterH2(stripCodeBlocks(stripped))
  checks.push({
    id: 'tldr-in-h2',
    label: 'A TL;DR (TldrSection) starts each H2',
    status: tldrCheck.allCovered ? 'pass' : 'fail',
    details: tldrCheck.total === 0 ? ['No H2 headings found'] : [`${tldrCheck.covered}/${tldrCheck.total} H2 with TL;DR`],
    automated: true,
  })

  // 5. Every <Quote> has author and source attributes.
  const quoteIssues: string[] = []
  const quoteRe = /<Quote\s+([^>]*?)\/?>/g
  let m: RegExpExecArray | null
  while ((m = quoteRe.exec(stripped)) !== null) {
    const props = m[1]
    if (!/author\s*=/.test(props) || !/source\s*=/.test(props)) quoteIssues.push(m[0].slice(0, 80))
  }
  checks.push({
    id: 'quotes-attribution',
    label: 'Every Quote has author and source attributes',
    status: quoteIssues.length === 0 ? 'pass' : 'fail',
    details: quoteIssues.length ? quoteIssues : undefined,
    automated: true,
  })

  // 6. A Sources block is present.
  checks.push({
    id: 'sources-block',
    label: 'A Sources block is present',
    status: /<Sources(?:\s|>)/.test(stripped) ? 'pass' : 'fail',
    automated: true,
  })

  // 7. HeroPromise.whatYouLearn filled (≥ 3 items).
  const hp = input.heroPromise as { whatYouLearn?: unknown } | null | undefined
  const wyl = Array.isArray(hp?.whatYouLearn) ? (hp!.whatYouLearn as unknown[]) : []
  checks.push({
    id: 'hero-promise',
    label: 'HeroPromise.whatYouLearn has ≥ 3 items',
    status: wyl.filter((x) => typeof x === 'string' && (x as string).trim().length > 0).length >= 3 ? 'pass' : 'fail',
    automated: true,
  })

  // 8. Primary CTA configured (label + href).
  const cta = input.primaryCta as { label?: unknown; href?: unknown } | null | undefined
  const hasCta = !!cta && typeof cta.href === 'string' && (cta.href as string).length > 0
  checks.push({
    id: 'primary-cta',
    label: 'Primary CTA configured (label + href)',
    status: hasCta ? 'pass' : 'fail',
    automated: true,
  })

  // 9. Author selected.
  checks.push({
    id: 'author',
    label: 'An author is selected',
    status: input.authorId ? 'pass' : 'fail',
    automated: true,
  })

  // 10. At least one DefinitionLink (concept mention).
  checks.push({
    id: 'definition-link',
    label: 'At least one DefinitionLink',
    status: meta.mentionedConcepts.length > 0 ? 'pass' : 'fail',
    automated: true,
  })

  // 11. Code only via fenced ``` (no JSX <CodeBlock> which loses content in RSC).
  const hasJsx = hasJsxCodeBlock(stripped)
  checks.push({
    id: 'no-jsx-codeblock',
    label: 'Code uses fenced ``` blocks (no JSX <CodeBlock>)',
    status: hasJsx ? 'fail' : 'pass',
    details: hasJsx ? ['Found <CodeBlock>…</CodeBlock>; rewrite as fenced ```lang … ```'] : undefined,
    automated: true,
  })

  // 12. No duplicate <Quote> bodies.
  const dupQuotes = findDuplicateQuotes(stripped)
  checks.push({
    id: 'quote-no-duplicate',
    label: 'No duplicate <Quote> bodies',
    status: dupQuotes.length === 0 ? 'pass' : 'fail',
    details: dupQuotes.length ? dupQuotes : undefined,
    automated: true,
  })

  // 13. Manual: numbers cite sources.
  checks.push({
    id: 'numbers-sources',
    label: 'All figures cite a source (manual check)',
    status: 'manual',
    automated: false,
  })

  // 14. Manual: read the headings and first paragraph of each H2 aloud.
  checks.push({
    id: 'read-aloud',
    label: 'Read each H2 heading and first paragraph aloud — reads naturally',
    status: 'manual',
    automated: false,
  })

  const canPublish = checks.every((c) => c.status === 'pass' || (!c.automated && c.status === 'manual'))
  return { checks, canPublish }
}
