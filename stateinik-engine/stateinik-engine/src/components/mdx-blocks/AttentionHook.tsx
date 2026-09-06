import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  caption?: string
}

export function AttentionHook({ children, caption }: Props) {
  return (
    <aside
      data-mdx-block="attention-hook"
      className="my-8 rounded-2xl border border-border-hover bg-bg-section p-6 md:p-8 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse, rgba(217,119,87,0.08) 0%, transparent 70%)',
        }}
      />
      <div className="font-head text-2xl text-text leading-snug">{children}</div>
      {caption && <div className="mt-3 text-sm text-text-sub">{caption}</div>}
    </aside>
  )
}
