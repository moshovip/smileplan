import type { ReactNode } from 'react'

interface StepsProps {
  children: ReactNode
}

interface StepProps {
  title?: string
  children: ReactNode
}

const STEP_COUNTER_STYLE = `
  ol[data-mdx-block="steps"] { counter-reset: mdx-step 0; }
  ol[data-mdx-block="steps"] > li[data-mdx-step] { counter-increment: mdx-step; }
  ol[data-mdx-block="steps"] > li[data-mdx-step] > span[data-step-counter]::before {
    content: counter(mdx-step);
  }
`

export function Steps({ children }: StepsProps) {
  return (
    <>
      <style>{STEP_COUNTER_STYLE}</style>
      <ol data-mdx-block="steps" className="my-6 list-none space-y-4">
        {children}
      </ol>
    </>
  )
}

export function Step({ title, children }: StepProps) {
  return (
    <li data-mdx-step className="relative rounded-2xl border border-border bg-bg-card p-5 pl-16">
      <span
        aria-hidden="true"
        data-step-counter
        className="absolute left-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-bg font-bold text-sm"
      />
      {title && <h4 className="font-head text-xl text-text mb-1 leading-tight">{title}</h4>}
      <div className="text-[15px] leading-relaxed text-text">{children}</div>
    </li>
  )
}
