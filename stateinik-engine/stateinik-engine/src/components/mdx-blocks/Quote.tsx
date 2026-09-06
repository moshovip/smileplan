import type { ReactNode } from 'react'

interface Props {
  author?: string
  source?: string
  sourceUrl?: string
  children: ReactNode
}

export function Quote({ author, source, sourceUrl, children }: Props) {
  return (
    <figure data-mdx-block="quote" className="my-6">
      <blockquote className="border-l-4 border-accent bg-bg-card rounded-r-2xl pl-6 pr-6 py-5">
        <p className="font-head text-2xl leading-snug text-text italic">{children}</p>
      </blockquote>
      {(author || source) && (
        <figcaption className="mt-3 text-sm text-text-sub pl-6">
          {author && <span className="text-text">- {author}</span>}
          {author && source && <span>, </span>}
          {source && sourceUrl ? (
            <a href={sourceUrl} className="text-accent hover:text-accent-hover underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              {source}
            </a>
          ) : source ? (
            <span>{source}</span>
          ) : null}
        </figcaption>
      )}
    </figure>
  )
}
