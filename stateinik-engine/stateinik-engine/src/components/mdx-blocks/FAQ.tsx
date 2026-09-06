'use client'

import { useState, useId, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface FAQProps {
  children: ReactNode
  title?: string
}

interface FAQItemProps {
  question: string
  children: ReactNode
}

export function FAQ({ children, title = 'Frequently asked questions' }: FAQProps) {
  return (
    <section data-mdx-block="faq" className="my-8" aria-label={title}>
      <h3 className="font-head text-2xl text-text mb-4">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

export function FAQItem({ question, children }: FAQItemProps) {
  const [open, setOpen] = useState(false)
  const buttonId = useId()
  const regionId = useId()

  return (
    <div
      data-mdx-block="faq-item"
      className="rounded-2xl border border-border bg-bg-card overflow-hidden"
    >
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-text hover:bg-bg-card-hover transition-colors"
      >
        <span className="text-[15px] font-medium">{question}</span>
        <ChevronDown
          size={18}
          strokeWidth={1.5}
          className={`shrink-0 text-text-sub transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-labelledby={buttonId}
          className="px-5 pb-5 text-[15px] leading-relaxed text-text border-t border-border"
        >
          <div className="pt-4">{children}</div>
        </div>
      )}
    </div>
  )
}
