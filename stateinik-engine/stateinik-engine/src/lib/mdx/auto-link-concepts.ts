import { buildMdxMask, isInsideMask, type MaskSpan } from './mask'

interface ConceptRef {
  term: string
  slug: string
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface AutoLinkResult {
  content: string
  linked: number
}

export function autoLinkConcepts(source: string, concepts: ConceptRef[]): string {
  return autoLinkConceptsWithCount(source, concepts).content
}

export function autoLinkConceptsWithCount(
  source: string,
  concepts: ConceptRef[],
): AutoLinkResult {
  if (!concepts.length) return { content: source, linked: 0 }
  const spans: MaskSpan[] = buildMdxMask(source, [
    'code-fence',
    'inline-code',
    'jsx-block',
    'md-link',
    'heading',
  ])
  let result = source
  let linked = 0
  const sorted = [...concepts].sort((a, b) => b.term.length - a.term.length)
  const usedSlugs = new Set<string>()

  for (const concept of sorted) {
    if (usedSlugs.has(concept.slug)) continue
    // ASCII character-class lookahead/lookbehind, because \b doesn't work with Cyrillic.
    const re = new RegExp(
      `(^|[^A-Za-zА-Яа-яЁё0-9_])(${escapeRegExp(concept.term)})(?=$|[^A-Za-zА-Яа-яЁё0-9_])`,
      'gi'
    )
    re.lastIndex = 0
    let m: RegExpExecArray | null
    let inserted = false
    while ((m = re.exec(result)) !== null) {
      const prefix = m[1] ?? ''
      const matched = m[2] ?? m[0]
      const startInsideTerm = m.index + prefix.length
      if (isInsideMask(spans, startInsideTerm, matched.length)) {
        re.lastIndex = startInsideTerm + matched.length
        continue
      }

      const replacement = `<DefinitionLink term="${concept.term}" slug="${concept.slug}">${matched}</DefinitionLink>`
      const lengthDelta = replacement.length - matched.length
      result = result.slice(0, startInsideTerm) + replacement + result.slice(startInsideTerm + matched.length)
      for (const s of spans) {
        if (s.start >= startInsideTerm) {
          s.start += lengthDelta
          s.end += lengthDelta
        }
      }
      spans.push({ start: startInsideTerm, end: startInsideTerm + replacement.length })
      spans.sort((a, b) => a.start - b.start)
      usedSlugs.add(concept.slug)
      linked += 1
      inserted = true
      break
    }
    if (!inserted) continue
  }

  return { content: result, linked }
}
