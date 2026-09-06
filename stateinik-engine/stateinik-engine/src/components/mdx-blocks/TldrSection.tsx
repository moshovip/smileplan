import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export function TldrSection({ children }: Props) {
  return (
    <aside
      data-mdx-block="tldr"
      role="note"
      aria-label="Key points in this section"
      className="my-6 border-l-4 border-accent bg-accent-soft rounded-r-2xl pl-5 pr-6 py-4 text-text"
    >
      <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-1">Key points</p>
      <div className="text-[15px] leading-relaxed">{children}</div>
    </aside>
  )
}
