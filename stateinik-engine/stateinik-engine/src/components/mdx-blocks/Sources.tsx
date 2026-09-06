import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title?: string
}

export function Sources({ children, title = 'Sources' }: Props) {
  return (
    <section
      data-mdx-block="sources"
      role="doc-bibliography"
      aria-label={title}
      className="my-8 rounded-2xl border border-border bg-bg-card-hover p-6"
    >
      <h3 className="font-head text-xl text-text mb-3">{title}</h3>
      <div className="text-[14px] leading-relaxed text-text-sub [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline">
        {children}
      </div>
    </section>
  )
}
