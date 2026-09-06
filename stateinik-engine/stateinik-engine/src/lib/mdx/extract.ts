/**
 * Extracts metadata from MDX source:
 * - TOC (H2/H3) for the table of contents
 * - FAQ/QA/Steps content for JSON-LD
 * - sources from Sources for citations
 * - VideoEmbed for VideoObject
 * - DefinitionLink for cross-linking concepts
 * - all external links for the broken-link checker
 *
 * Implemented with regexes rather than an AST: the pipeline stays fast
 * and doesn't pull an extra remark-mdx into the bundle.
 */

const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/

export interface TocEntry {
  level: 2 | 3
  text: string
  slug: string
}

export interface FaqEntry {
  question: string
  answer: string
}

export interface StepEntry {
  title?: string
  body: string
}

export interface VideoEntry {
  url?: string
  id?: string
  provider?: 'youtube' | 'vimeo' | 'kinescope'
  title?: string
  duration?: number
}

export interface ConceptMention {
  term: string
  slug: string
}

export interface SourceEntry {
  text: string
  url: string
}

export interface ExternalLink {
  text: string
  url: string
}

export interface ImageEntry {
  url: string
  alt?: string
  title?: string
}

export interface MdxMeta {
  toc: TocEntry[]
  faq: FaqEntry[]
  steps: StepEntry[]
  sources: SourceEntry[]
  videos: VideoEntry[]
  mentionedConcepts: ConceptMention[]
  externalLinks: ExternalLink[]
  images: ImageEntry[]
}

const RU_LAT_RE = /[^a-zа-яё0-9\s-]/gi
const SPACE_RE = /\s+/g

function transliterate(input: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  }
  return input
    .toLowerCase()
    .split('')
    .map(ch => (ch in map ? map[ch] : ch))
    .join('')
}

export function slugify(text: string): string {
  return transliterate(text.toLowerCase().trim())
    .replace(RU_LAT_RE, '')
    .replace(SPACE_RE, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function stripFrontmatter(source: string): string {
  return source.replace(FRONTMATTER_RE, '')
}

function parseJsxProps(propsString: string): Record<string, string> {
  const props: Record<string, string> = {}
  const re = /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(propsString)) !== null) {
    const value = m[2] ?? m[3] ?? m[4]
    if (value !== undefined) props[m[1]] = value.trim()
  }
  return props
}

function extractToc(source: string): TocEntry[] {
  const entries: TocEntry[] = []
  const lines = source.split('\n')
  let inFence = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/)
    if (!m) continue
    const level = m[1].length as 2 | 3
    const text = m[2].replace(/[*_`]/g, '').trim()
    entries.push({ level, text, slug: slugify(text) })
  }
  return entries
}

function extractFaq(source: string): FaqEntry[] {
  const items: FaqEntry[] = []
  const re = /<FAQItem(?:\s+[^>]*)?>([\s\S]*?)<\/FAQItem>/g
  const propsRe = /<FAQItem\s+([^>]*?)>/
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const openMatch = m[0].match(propsRe)
    const props = openMatch ? parseJsxProps(openMatch[1]) : {}
    const question = props.question || ''
    const answer = m[1]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    if (question || answer) items.push({ question, answer })
  }
  // QA blocks (just paragraphs after H3-style ## question)
  const qaRe = /<QA(?:\s+[^>]*)?>([\s\S]*?)<\/QA>/g
  while ((m = qaRe.exec(source)) !== null) {
    const inner = m[1]
    const qm = inner.match(/<question>([\s\S]*?)<\/question>/i)
    const am = inner.match(/<answer>([\s\S]*?)<\/answer>/i)
    if (qm && am) {
      items.push({
        question: qm[1].replace(/<[^>]+>/g, '').trim(),
        answer: am[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
      })
    }
  }
  return items
}

function extractSteps(source: string): StepEntry[] {
  const items: StepEntry[] = []
  const re = /<Step(?:\s+([^>]*?))?>([\s\S]*?)<\/Step>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const props = m[1] ? parseJsxProps(m[1]) : {}
    items.push({
      title: props.title,
      body: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    })
  }
  return items
}

function extractVideos(source: string): VideoEntry[] {
  const items: VideoEntry[] = []
  const re = /<VideoEmbed\s+([^/>]+?)\/?>/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const props = parseJsxProps(m[1])
    if (props.url || props.id) {
      items.push({
        url: props.url,
        id: props.id,
        provider: props.provider as VideoEntry['provider'] | undefined,
        title: props.title,
        duration: props.duration ? Number(props.duration) : undefined,
      })
    }
  }
  return items
}

function extractMentionedConcepts(source: string): ConceptMention[] {
  const items: ConceptMention[] = []
  const re = /<DefinitionLink\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/DefinitionLink>)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    const props = parseJsxProps(m[1])
    const term = props.term
    if (!term) continue
    const slug = props.slug || slugify(term)
    if (!items.some(c => c.slug === slug)) items.push({ term, slug })
  }
  return items
}

function extractSources(source: string): SourceEntry[] {
  const items: SourceEntry[] = []
  const sourcesBlock = source.match(/<Sources(?:\s+[^>]*)?>([\s\S]*?)<\/Sources>/)
  if (!sourcesBlock) return items
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(sourcesBlock[1])) !== null) {
    items.push({ text: m[1], url: m[2] })
  }
  return items
}

function extractExternalLinks(source: string): ExternalLink[] {
  const items: ExternalLink[] = []
  const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(source)) !== null) {
    items.push({ text: m[1], url: m[2] })
  }
  return items
}

function extractImages(source: string): ImageEntry[] {
  const items: ImageEntry[] = []
  const seen = new Set<string>()
  // Markdown: ![alt](url "optional title")
  const mdRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g
  let m: RegExpExecArray | null
  while ((m = mdRe.exec(source)) !== null) {
    const url = m[2]
    if (seen.has(url)) continue
    seen.add(url)
    items.push({ url, alt: m[1] || undefined, title: m[3] || undefined })
  }
  // JSX: <img src="..." alt="..." /> and <ImageWithAlt src="..." alt="..." />
  const jsxRe = /<(?:img|ImageWithAlt|Image)\s+([^>]+?)\/?>/g
  while ((m = jsxRe.exec(source)) !== null) {
    const props = parseJsxProps(m[1])
    const url = props.src
    if (!url || seen.has(url)) continue
    seen.add(url)
    items.push({ url, alt: props.alt, title: props.title })
  }
  return items
}

export function extractMdxMeta(source: string): MdxMeta {
  const stripped = stripFrontmatter(source)
  return {
    toc: extractToc(stripped),
    faq: extractFaq(stripped),
    steps: extractSteps(stripped),
    sources: extractSources(stripped),
    videos: extractVideos(stripped),
    mentionedConcepts: extractMentionedConcepts(stripped),
    externalLinks: extractExternalLinks(stripped),
    images: extractImages(stripped),
  }
}
