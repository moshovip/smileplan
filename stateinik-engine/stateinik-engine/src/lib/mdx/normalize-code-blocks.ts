/**
 * Normalizes JSX <CodeBlock> into fenced ``` ``` ``` blocks.
 *
 * Why: when serializing, next-mdx-remote/rsc 6.x loses the contents of
 * multi-line {`...`} template literals inside JSX children — the page renders
 * an empty box. The render-level fix (see MdxPre.tsx) makes fenced
 * ```lang ... ``` equivalent to <CodeBlock>: Shiki highlighting and the
 * "Copy" button work the same way.
 *
 * This module is the last line of defence: whatever the author wrote (AI
 * generator, admin in the editor, import script), the JSX form is rewritten
 * to fenced on save to the DB. After that, rendering always works.
 *
 * Used in:
 *  - PUT/POST /api/admin/guides → before validateMdxSource and the DB write
 *  - scripts/guides/normalize-codeblocks.ts → migration pass over
 *    existing guides
 *  - src/lib/guides/from-transcript.ts → normalizing a draft from Claude
 */

// Captures these forms:
//   1) <CodeBlock language="X">{`...`}</CodeBlock>   — JSX expression + template literal
//   2) <CodeBlock language="X">plain text</CodeBlock> — simple children
//   3) <CodeBlock>{`...`}</CodeBlock> — no language
//
// We leave the self-closing <CodeBlock /> alone (pointless, but syntactically valid).
const JSX_CODEBLOCK_RE =
  /<CodeBlock(\s[^>]*?)?>([\s\S]*?)<\/CodeBlock>/g

const LANG_ATTR_RE = /\blanguage\s*=\s*"([^"]*)"/
const TEMPLATE_LITERAL_RE = /^\s*\{\s*`([\s\S]*)`\s*\}\s*$/

interface NormalizeStats {
  replaced: number
  /** Which languages were encountered — for logs */
  languages: string[]
}

export interface NormalizeResult {
  content: string
  stats: NormalizeStats
}

/**
 * Rewrites all JSX forms of `<CodeBlock>` into fenced markdown.
 * Idempotent: a repeat run changes nothing.
 */
export function normalizeCodeBlocks(source: string): NormalizeResult {
  const languages: string[] = []
  let replaced = 0

  const out = source.replace(JSX_CODEBLOCK_RE, (full, attrs: string | undefined, inner: string) => {
    const langMatch = attrs ? attrs.match(LANG_ATTR_RE) : null
    const language = langMatch?.[1]?.trim() ?? ''

    // Case {`...`}: pull the contents out of the template literal.
    const tl = inner.match(TEMPLATE_LITERAL_RE)
    let body: string
    if (tl) {
      body = tl[1]
      // Inside an MDX template literal the contents may have been escaped (\` → `).
      // Unescape so the fenced block looks natural.
      body = body.replace(/\\`/g, '`').replace(/\\\$/g, '$')
    } else {
      body = inner
    }

    body = body.replace(/^\n+/, '').replace(/\n+$/, '')

    // If there are triple backticks (or more) inside, the outer fence must be longer,
    // otherwise markdown closes on the first "```" it hits. CommonMark supports
    // fence blocks of any length ≥ 3.
    const longest = (body.match(/`{3,}/g) ?? [])
      .reduce((max, run) => Math.max(max, run.length), 0)
    const fenceLen = Math.max(3, longest + 1)
    const fence = '`'.repeat(fenceLen)

    replaced += 1
    if (language) languages.push(language)

    return fence + language + '\n' + body + '\n' + fence
  })

  return {
    content: out,
    stats: { replaced, languages: Array.from(new Set(languages)) },
  }
}

const JSX_CODEBLOCK_TEST_RE = /<CodeBlock(\s[^>]*?)?>([\s\S]*?)<\/CodeBlock>/

/**
 * True if the source contains at least one JSX `<CodeBlock>`.
 * Used in the pre-publish gate / AntiAi to issue a warning.
 */
export function hasJsxCodeBlock(source: string): boolean {
  return JSX_CODEBLOCK_TEST_RE.test(source)
}
