'use client'

import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

// Snippet palette. Keep in sync with the component registry in
// src/components/mdx-blocks/index.ts (only whitelisted blocks belong here).
const MDX_SNIPPETS: Array<{ label: string; insert: string }> = [
  { label: 'TldrSection', insert: '<TldrSection>\n\nThe key takeaway in 1–2 sentences.\n\n</TldrSection>' },
  { label: 'Steps', insert: '<Steps>\n  <Step title="Step 1">\n    What to do.\n  </Step>\n</Steps>' },
  { label: 'Callout', insert: '<Callout type="info">\nSomething worth highlighting.\n</Callout>' },
  { label: 'FAQ', insert: '<FAQ>\n  <FAQItem question="A question?">\n    The answer.\n  </FAQItem>\n</FAQ>' },
  { label: 'Quote', insert: '<Quote author="First Last" source="where it is from">\nThe quote.\n</Quote>' },
  { label: 'Stat', insert: '<Stat value="3 hours" label="time saved" />' },
  { label: 'Compare', insert: '<Compare left="Before" right="After">\n- old approach\n+ new approach\n</Compare>' },
  { label: 'Sources', insert: '<Sources>\n- [Source 1](https://...)\n- [Source 2](https://...)\n</Sources>' },
  { label: 'Mermaid', insert: '<Mermaid chart={`graph TD; A-->B;`} />' },
  { label: 'CTA', insert: '<CTA heading="Ready to start?" label="Get started" href="/start" />' },
  { label: 'AttentionHook', insert: '<AttentionHook>\nA line that pulls the reader in.\n</AttentionHook>' },
  { label: 'DefinitionLink', insert: '<DefinitionLink term="Term" slug="term">term</DefinitionLink>' },
  { label: 'ImageWithAlt', insert: '<ImageWithAlt src="https://..." alt="What is in the image" />' },
  { label: 'HeroPromise', insert: '<HeroPromise />' },
  { label: 'Prerequisites', insert: '<Prerequisites />' },
  { label: 'RequiredTools', insert: '<RequiredTools />' },
]

function pluralTerms(n: number): string {
  return n === 1 ? 'term' : 'terms'
}

export interface MdxEditorHandle {
  insertAtCursor: (text: string) => void
  getContent: () => string
}

interface Props {
  value: string
  onChange: (next: string) => void
  showPreview: boolean
  previewHtml?: string | null
  previewError?: string | null
}

export const MdxEditor = forwardRef<MdxEditorHandle, Props>(function MdxEditor(
  { value, onChange, showPreview, previewHtml, previewError },
  ref
) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [autoLinking, setAutoLinking] = useState(false)
  const [autoLinkError, setAutoLinkError] = useState<string | null>(null)
  const [autoLinkToast, setAutoLinkToast] = useState<string | null>(null)

  useImperativeHandle(ref, () => ({
    insertAtCursor(text: string) {
      const el = textareaRef.current
      if (!el) {
        onChange(value + '\n' + text)
        return
      }
      const start = el.selectionStart
      const end = el.selectionEnd
      const next = value.slice(0, start) + text + value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + text.length
        el.selectionStart = pos
        el.selectionEnd = pos
      })
    },
    getContent() {
      return value
    },
  }))

  async function runAutoLinkConcepts() {
    setAutoLinking(true)
    setAutoLinkError(null)
    setAutoLinkToast(null)
    try {
      const res = await fetch('/api/admin/guides/auto-link-concepts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: value }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Error')
      }
      const data = await res.json()
      const linked: number = typeof data.linked === 'number' ? data.linked : 0
      if (data.content && data.content !== value) {
        onChange(data.content)
      }
      setAutoLinkToast(
        linked > 0 ? `Linked ${linked} ${pluralTerms(linked)}` : 'No new terms found',
      )
      setTimeout(() => setAutoLinkToast(null), 4000)
    } catch (e) {
      setAutoLinkError(e instanceof Error ? e.message : 'Error')
    } finally {
      setAutoLinking(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-bg-card border border-border rounded-2xl p-3 mb-3">
        <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-2">Blocks</div>
        <div className="flex flex-wrap gap-1.5">
          {MDX_SNIPPETS.map(s => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                const el = textareaRef.current
                if (!el) {
                  onChange(value + '\n' + s.insert + '\n')
                  return
                }
                const start = el.selectionStart
                const end = el.selectionEnd
                const next = value.slice(0, start) + s.insert + value.slice(end)
                onChange(next)
                requestAnimationFrame(() => {
                  el.focus()
                  const pos = start + s.insert.length
                  el.selectionStart = pos
                  el.selectionEnd = pos
                })
              }}
              className="bg-white/5 hover:bg-white/10 text-text-sub hover:text-text px-2.5 py-1 rounded-lg text-[11px] font-mono"
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border">
          <button
            type="button"
            onClick={runAutoLinkConcepts}
            disabled={autoLinking}
            className="text-accent hover:text-accent-hover text-[12px] disabled:opacity-40"
          >
            {autoLinking ? 'Linking…' : 'Auto-link concepts'}
          </button>
          {autoLinkError && (
            <span className="text-red-400 text-[11px]">{autoLinkError}</span>
          )}
          {autoLinkToast && !autoLinkError && (
            <span className="text-text-sub text-[11px]">{autoLinkToast}</span>
          )}
        </div>
      </div>

      <div className={`flex-1 min-h-[400px] ${showPreview ? 'grid grid-cols-2 gap-3' : ''}`}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          spellCheck={false}
          className="w-full h-full min-h-[600px] bg-bg border border-border rounded-2xl px-4 py-3 text-[13px] text-text font-mono leading-relaxed resize-none focus:outline-none focus:border-accent"
        />

        {showPreview && (
          <div className="bg-bg-card border border-border rounded-2xl p-4 overflow-auto max-h-[700px]">
            <div className="text-text-dim text-[11px] uppercase tracking-[0.1em] mb-2">Live preview</div>
            {previewError ? (
              <pre className="text-red-400 text-[12px] whitespace-pre-wrap font-mono">{previewError}</pre>
            ) : (
              <div
                className="prose prose-invert max-w-none text-text text-[14px]"
                dangerouslySetInnerHTML={{ __html: previewHtml ?? '' }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
})
