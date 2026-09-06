import { highlight } from '@/lib/mdx/shiki-singleton'
import { CopyButton } from './CopyButton'

interface Props {
  children: string
  language?: string
  filename?: string
}

export async function CodeBlock({ children, language = 'text', filename }: Props) {
  const raw = typeof children === 'string' ? children : String(children ?? '')
  let html: string
  try {
    html = await highlight(raw, language)
  } catch {
    html = `<pre><code>${raw.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string))}</code></pre>`
  }

  return (
    <div data-mdx-block="codeblock" className="my-6 group relative rounded-2xl border border-border bg-bg-card overflow-hidden">
      {(filename || language !== 'text') && (
        <div className="flex items-center justify-between gap-3 px-5 py-2 border-b border-border bg-bg-card-hover text-xs text-text-sub">
          <span className="font-mono">{filename ?? language}</span>
        </div>
      )}
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={raw} label="Copy" blockType="codeblock" analyticsPayload={{ language, filename }} />
      </div>
      <div
        className="[&_pre]:bg-transparent [&_pre]:m-0 [&_pre]:px-5 [&_pre]:py-4 [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_pre]:overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
