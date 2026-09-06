import type { Highlighter, BundledLanguage } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null
const loadedLangs = new Set<string>()

const DEFAULT_LANGS: BundledLanguage[] = [
  'typescript',
  'javascript',
  'tsx',
  'jsx',
  'json',
  'bash',
  'shell',
  'sql',
  'python',
  'css',
  'html',
  'markdown',
  'yaml',
  'diff',
]

export async function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    const { createHighlighter } = await import('shiki')
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: DEFAULT_LANGS,
    })
    DEFAULT_LANGS.forEach(l => loadedLangs.add(l))
  }
  return highlighterPromise
}

export async function highlight(code: string, lang: string): Promise<string> {
  const hl = await getHighlighter()
  const safeLang = lang && lang !== 'text' ? lang : 'text'
  if (safeLang !== 'text' && !loadedLangs.has(safeLang)) {
    try {
      await hl.loadLanguage(safeLang as BundledLanguage)
      loadedLangs.add(safeLang)
    } catch {
      // Unknown language - render as plain text
      return hl.codeToHtml(code, { lang: 'text', theme: 'github-dark' })
    }
  }
  return hl.codeToHtml(code, { lang: safeLang as BundledLanguage | 'text', theme: 'github-dark' })
}
