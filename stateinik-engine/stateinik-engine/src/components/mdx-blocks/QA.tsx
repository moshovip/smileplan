import type { ReactNode } from 'react'

interface Props {
  question: string
  children: ReactNode
}

export function QA({ question, children }: Props) {
  return (
    <div data-mdx-block="qa" className="my-6">
      <h3 className="font-head text-2xl text-text mb-2 leading-tight">{question}</h3>
      <div className="text-[15px] leading-relaxed text-text">{children}</div>
    </div>
  )
}
