import type { ReactNode } from 'react'
import { isExternalUrl } from '@/lib/links/external'

/**
 * Override for the `a` tag in MDX content and react-markdown.
 * External links (to another domain) open in a new tab with a safe rel,
 * so the reader doesn't lose their place in the article (support request 2026-05-31).
 * Internal links are left as is — same tab.
 *
 * react-markdown also passes a `node` prop — we don't use it (not forwarded to the DOM).
 */
interface MdxLinkProps {
  href?: string
  title?: string
  children?: ReactNode
}

export function MdxLink({ href, title, children }: MdxLinkProps) {
  const external = isExternalUrl(href)
  return (
    <a href={href} title={title} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {children}
    </a>
  )
}
