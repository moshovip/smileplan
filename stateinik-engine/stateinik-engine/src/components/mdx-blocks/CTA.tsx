import type { ReactNode } from 'react'

interface CTAProps {
  /** Button label. Falls back to children. */
  label?: string
  /** Destination URL. If absent, the block renders nothing. */
  href?: string
  /** Optional supporting line above the button. */
  heading?: string
  children?: ReactNode
}

// Generic, config-driven call-to-action block for use inside MDX:
//   <CTA heading="Ready to dive in?" label="Get started" href="/start" />
// Replaces the host platform's hardwired conversion funnels — adopters point it
// wherever they like, or omit href to render nothing.
export function CTA({ label, href, heading, children }: CTAProps) {
  if (!href) return null
  return (
    <div className="not-prose my-8 rounded-xl border border-border bg-bg-card p-6">
      {heading && <p className="mb-3 text-lg font-medium text-text">{heading}</p>}
      <a
        href={href}
        className="inline-flex rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
      >
        {label || children || 'Learn more'}
      </a>
    </div>
  )
}
