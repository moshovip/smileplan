import Link from 'next/link'
import { routes } from '@/site.config'

export interface SocialLink {
  label: string
  url: string
}

export interface AuthorCardData {
  slug: string | null
  name: string | null
  title: string | null
  bio: string | null
  avatar: string | null
  /** Array of { label, url } — stored on Author.socialLinks (Json). */
  socialLinks: SocialLink[] | unknown | null
}

function normalizeLinks(raw: AuthorCardData['socialLinks']): SocialLink[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (l): l is SocialLink =>
      !!l && typeof l === 'object' && typeof (l as SocialLink).url === 'string',
  )
}

export function GuideAuthorCard({ author }: { author: AuthorCardData }) {
  const links = normalizeLinks(author.socialLinks)

  return (
    <section
      data-block="guide-author-card"
      className="my-10 rounded-2xl border border-border bg-bg-card p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="shrink-0">
          {author.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatar}
              alt={author.name ?? ''}
              width={84}
              height={84}
              className="rounded-2xl border border-border object-cover"
            />
          ) : (
            <div
              className="w-[84px] h-[84px] rounded-2xl border border-border bg-bg-card-hover flex items-center justify-center font-head text-2xl text-text"
              aria-hidden="true"
            >
              {(author.name ?? '?').slice(0, 1)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-text-sub text-[11px] font-semibold uppercase tracking-[0.15em] mb-2">Author</div>
          {author.slug ? (
            <Link href={routes.author(author.slug)} className="font-head text-2xl text-text hover:text-accent">
              {author.name}
            </Link>
          ) : (
            <span className="font-head text-2xl text-text">{author.name}</span>
          )}
          {author.title && <div className="text-text-sub text-sm mt-1">{author.title}</div>}
          {author.bio && (
            <p className="text-text text-[15px] leading-relaxed mt-3 whitespace-pre-line">{author.bio}</p>
          )}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-border bg-bg-card-hover hover:border-accent px-3 py-1 text-xs text-text-sub hover:text-accent transition-colors"
                >
                  {link.label || link.url}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
