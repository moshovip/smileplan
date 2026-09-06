import Link from 'next/link'
import { siteConfig } from '@/site.config'

// Minimal, brand-agnostic site header. Nav items come from site.config.ts.
// Swap this out wholesale for your own design — it's intentionally plain.
export function Header() {
  const items = siteConfig.nav.filter((item) => {
    if (item.key === 'concepts' && !siteConfig.hasConcepts) return false
    return true
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
        <Link href="/" className="font-head text-lg font-semibold text-text">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="text-text-sub transition hover:text-text"
            >
              {labelFor(item.key)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

function labelFor(key: string): string {
  switch (key) {
    case 'guides':
      return 'Guides'
    case 'concepts':
      return 'Glossary'
    case 'authors':
      return 'Authors'
    default:
      return key
  }
}
