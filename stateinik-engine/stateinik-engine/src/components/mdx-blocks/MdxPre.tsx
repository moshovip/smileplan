import type { ReactElement, ReactNode } from 'react'
import { CodeBlock } from './CodeBlock'

// Override the standard <pre> in MDX: fenced code blocks (```lang ... ```)
// render through CodeBlock with Shiki highlighting, a language header, and CopyButton.
// Without this override, the standard <pre><code> renders without styles and without copy.
//
// Why: in the JSX-expression form <CodeBlock>{`...`}</CodeBlock>, next-mdx-remote/rsc
// sometimes loses the contents of multiline template literals (especially with escaped
// backticks). Fenced ```lang ... ``` is handled by remark-gfm as usual and delivers
// the raw text without surprises.

interface CodeElementProps {
  children?: ReactNode
  className?: string
}

interface PreProps {
  children?: ReactNode
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as ReactElement<{ children?: ReactNode }>).props?.children)
  }
  return ''
}

export function MdxPre({ children }: PreProps) {
  // children — usually a single <code> with className="language-xxx"
  const codeEl =
    children && typeof children === 'object' && 'props' in children
      ? (children as ReactElement<CodeElementProps>)
      : null

  if (!codeEl) {
    return <pre>{children}</pre>
  }

  const className = codeEl.props?.className ?? ''
  const langMatch = className.match(/language-([\w-]+)/)
  const language = langMatch?.[1]
  const raw = extractText(codeEl.props?.children).replace(/\n$/, '')

  return <CodeBlock language={language}>{raw}</CodeBlock>
}
