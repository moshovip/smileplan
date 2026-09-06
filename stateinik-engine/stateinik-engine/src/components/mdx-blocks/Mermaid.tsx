'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: string
}

const MERMAID_THEME = {
  theme: 'base',
  themeVariables: {
    background: '#1b1a19',
    primaryColor: '#1b1a19',
    primaryTextColor: '#ede9e3',
    primaryBorderColor: '#3a3734',
    lineColor: '#a8a29e',
    secondaryColor: '#222120',
    tertiaryColor: '#191817',
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
    fontSize: '14px',
  },
} as const

export function Mermaid({ children }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    if (svg || error) return

    let cancelled = false
    let mounted = true

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', ...MERMAID_THEME })
        const id = `mermaid-${Math.random().toString(36).slice(2, 8)}`
        const { svg: out } = await mermaid.render(id, children.trim())
        if (!cancelled && mounted) setSvg(out)
      } catch (e) {
        if (!cancelled && mounted) setError((e as Error).message || 'Failed to render the diagram')
      }
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.1) {
            observer.disconnect()
            void render()
          }
        })
      },
      { threshold: 0.1 }
    )
    observer.observe(node)

    return () => {
      cancelled = true
      mounted = false
      observer.disconnect()
    }
  }, [children, svg, error])

  return (
    <div
      ref={containerRef}
      data-mdx-block="mermaid"
      className="my-6 rounded-2xl border border-border bg-bg-card p-5 min-h-[200px] flex items-center justify-center overflow-x-auto"
    >
      {error ? (
        <div className="text-red-400 text-sm">Diagram: {error}</div>
      ) : svg ? (
        <div className="w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <div className="text-text-dim text-sm">Loading diagram…</div>
      )}
    </div>
  )
}
