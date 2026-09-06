export interface MaskSpan {
  start: number
  end: number
}

export type MaskKind = 'code-fence' | 'inline-code' | 'jsx-block' | 'md-link' | 'heading'

const REGEXPS: Record<MaskKind, RegExp> = {
  'code-fence': /```[\s\S]*?```/g,
  'inline-code': /`[^`]*`/g,
  'jsx-block':
    /<[A-Z][A-Za-z0-9]*(?:\s[^<>]*)?>[\s\S]*?<\/[A-Z][A-Za-z0-9]*>|<[A-Z][A-Za-z0-9]*(?:\s[^<>]*)?\/>/g,
  'md-link': /\[[^\]]*\]\([^)]*\)/g,
  'heading': /^#{1,6}\s.*$/gm,
}

export function buildMdxMask(source: string, kinds: MaskKind[]): MaskSpan[] {
  const spans: MaskSpan[] = []
  for (const kind of kinds) {
    const re = REGEXPS[kind]
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(source)) !== null) {
      spans.push({ start: m.index, end: m.index + m[0].length })
    }
  }
  spans.sort((a, b) => a.start - b.start)
  const merged: MaskSpan[] = []
  for (const s of spans) {
    const last = merged[merged.length - 1]
    if (last && s.start <= last.end) last.end = Math.max(last.end, s.end)
    else merged.push({ ...s })
  }
  return merged
}

export function isInsideMask(spans: MaskSpan[], index: number, length: number): boolean {
  return spans.some(s => index < s.end && index + length > s.start)
}
