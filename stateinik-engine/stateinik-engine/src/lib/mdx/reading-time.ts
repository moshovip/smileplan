const WORD_RE = /[A-Za-zА-Яа-яЁё0-9]+/g
const MDX_TAG_RE = /<\/?[A-Za-z][^>]*>/g
const CODE_FENCE_RE = /```[\s\S]*?```/g
const INLINE_CODE_RE = /`[^`]*`/g
const FRONTMATTER_RE = /^---\n[\s\S]*?\n---\n/

export function calculateReadingMinutes(source: string): number {
  const cleaned = source
    .replace(FRONTMATTER_RE, '')
    .replace(CODE_FENCE_RE, ' ')
    .replace(INLINE_CODE_RE, ' ')
    .replace(MDX_TAG_RE, ' ')

  const words = cleaned.match(WORD_RE)
  const count = words ? words.length : 0
  return Math.max(1, Math.round(count / 200))
}
