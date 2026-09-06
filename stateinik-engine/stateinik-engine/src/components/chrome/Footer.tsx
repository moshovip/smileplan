import Link from 'next/link'
import { siteConfig, routes } from '@/site.config'

// Minimal site footer. Replace with your own — kept deliberately plain.
export function Footer() {
  return (
    <footer className="border-t border-border bg-bg-section">
      <div className="mx-auto flex max-w-content flex-col gap-4 px-6 py-10 text-sm text-text-sub sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {siteConfig.name}. Built with{' '}
          <a
            href="https://github.com/"
            className="text-text-sub underline transition hover:text-text"
          >
            Stateinik
          </a>
          .
        </p>
        <nav className="flex gap-5">
          <Link href={routes.guides()} className="transition hover:text-text">
            Guides
          </Link>
          {siteConfig.hasConcepts && (
            <Link href={routes.concepts()} className="transition hover:text-text">
              Glossary
            </Link>
          )}
          <Link href={routes.search()} className="transition hover:text-text">
            Search
          </Link>
        </nav>
      </div>
    </footer>
  )
}
