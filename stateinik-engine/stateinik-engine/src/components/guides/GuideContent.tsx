import type { ReactNode } from 'react'
import { siteConfig } from '@/site.config'

interface Props {
  content: ReactNode
  /** Optional per-guide CTA (Guide.primaryCta JSON: { label, href }). */
  primaryCta?: { label?: string; href?: string } | null
}

// Renders compiled MDX inside the prose theme, with an optional footer CTA.
// The CTA comes from the guide's own `primaryCta`, falling back to the
// site-wide CTA configured in site.config.ts. Disabled when neither is set.
export function GuideContent({ content, primaryCta }: Props) {
  const cta =
    primaryCta?.href && primaryCta?.label
      ? { href: primaryCta.href, label: primaryCta.label }
      : siteConfig.cta.enabled && siteConfig.cta.href
        ? { href: siteConfig.cta.href, label: siteConfig.cta.label }
        : null

  return (
    <article
      data-guide-content
      className="
        prose prose-invert max-w-none
        prose-headings:font-head prose-headings:text-text
        prose-h1:text-[clamp(32px,4.5vw,48px)] prose-h1:leading-[1.1]
        prose-h2:text-[clamp(28px,4vw,42px)] prose-h2:leading-tight prose-h2:mt-12
        prose-h3:text-[clamp(20px,3vw,28px)] prose-h3:leading-tight
        prose-p:text-text prose-p:text-[17px] prose-p:leading-[1.7]
        prose-li:text-text prose-li:text-[17px]
        prose-strong:text-text prose-strong:font-semibold
        prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:break-words
        prose-code:text-accent prose-code:bg-bg-card-hover prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-code:[overflow-wrap:anywhere]
        prose-blockquote:border-l-accent prose-blockquote:text-text-sub
      "
    >
      {content}

      {cta && (
        <div className="not-prose mt-12">
          <a
            href={cta.href}
            className="inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
          >
            {cta.label}
          </a>
        </div>
      )}
    </article>
  )
}
