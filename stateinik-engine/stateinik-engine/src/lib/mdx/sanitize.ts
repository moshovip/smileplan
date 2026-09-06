/**
 * MDX sanitizer. A whitelist of allowed JSX components plus injection checks.
 * Applied both on save and on render as defence against malicious MDX.
 *
 * Keep this set in sync with the component registry in
 * src/components/mdx-blocks/index.ts.
 */

export const ALLOWED_COMPONENTS = new Set<string>([
  // Content
  'TldrSection',
  'Steps',
  'Step',
  'Callout',
  'Mermaid',
  'FAQ',
  'FAQItem',
  'QA',
  'CodeBlock',
  'Quote',
  'Stat',
  'Compare',
  'Sources',
  'DefinitionLink',
  // Media
  'VideoEmbed',
  'TelegramEmbed',
  'ImageWithAlt',
  // Metadata
  'HeroPromise',
  'Prerequisites',
  'RequiredTools',
  'Changelog',
  'AiDisclosure',
  'SeriesNavigation',
  // Conversion / engagement
  'CTA',
  'SocialProof',
  'GuideFeedback',
  'AttentionHook',
  // Cross-linking
  'RelatedGuides',
  'EmbedGuide',
  'RelatedConcepts',
])

const BLOCKED_TAGS = new Set(['script', 'iframe', 'object', 'embed', 'link', 'meta', 'style'])

const EVENT_ATTR_RE = /\son[a-z]+\s*=/i
const JS_URL_RE = /(?:href|src|action|formaction)\s*=\s*["']?\s*javascript:|\(\s*javascript:/i
const SCRIPT_TAG_RE = /<\s*script[\s>]/i
const IFRAME_TAG_RE = /<\s*iframe[\s>]/i
const STYLE_TAG_RE = /<\s*style[\s>]/i
const OBJECT_TAG_RE = /<\s*(object|embed)[\s>]/i

const JSX_OPEN_TAG_RE = /<([A-Z][A-Za-z0-9]*)[\s/>]/g

export interface ValidateResult {
  ok: boolean
  errors: string[]
}

export function validateMdxSource(source: string): ValidateResult {
  const errors: string[] = []

  if (SCRIPT_TAG_RE.test(source)) errors.push('<script> found — not allowed')
  if (IFRAME_TAG_RE.test(source)) errors.push('Raw <iframe> found — use TelegramEmbed/VideoEmbed')
  if (STYLE_TAG_RE.test(source)) errors.push('<style> found — not allowed')
  if (OBJECT_TAG_RE.test(source)) errors.push('<object>/<embed> found — not allowed')
  if (EVENT_ATTR_RE.test(source)) errors.push('on* attributes (onClick/onLoad/...) found — not allowed in MDX source')
  if (JS_URL_RE.test(source)) errors.push('javascript: URL found — not allowed')

  BLOCKED_TAGS.forEach(tag => {
    const re = new RegExp(`<\\s*${tag}[\\s>]`, 'i')
    if (re.test(source)) errors.push(`Disallowed tag <${tag}>`)
  })

  const usedComponents = new Set<string>()
  let match: RegExpExecArray | null
  while ((match = JSX_OPEN_TAG_RE.exec(source)) !== null) {
    usedComponents.add(match[1])
  }
  JSX_OPEN_TAG_RE.lastIndex = 0

  usedComponents.forEach(name => {
    if (!ALLOWED_COMPONENTS.has(name)) {
      errors.push(`Component <${name}> is not allowed — add it to the whitelist or replace it`)
    }
  })

  return { ok: errors.length === 0, errors }
}
