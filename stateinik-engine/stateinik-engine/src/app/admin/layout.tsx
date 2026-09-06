import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-helpers'
import { siteConfig } from '@/site.config'
import { LogoutButton } from '@/components/admin/LogoutButton'

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/guides', label: 'Guides' },
  { href: '/admin/concepts', label: 'Concepts', requiresConcepts: true },
  { href: '/admin/authors', label: 'Authors' },
  { href: '/admin/series', label: 'Series' },
  { href: '/admin/topics', label: 'Topics' },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()
  if (!user?.isAdmin) redirect('/login')

  const items = NAV.filter((i) => !i.requiresConcepts || siteConfig.hasConcepts)

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-content items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-head text-lg font-semibold">
              {siteConfig.name}
              <span className="ml-2 text-xs font-normal text-text-dim">admin</span>
            </Link>
            <nav className="flex gap-5 text-sm">
              {items.map((i) => (
                <Link key={i.href} href={i.href} className="text-text-sub transition hover:text-text">
                  {i.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm text-text-sub">
            <Link href="/" className="transition hover:text-text">View site →</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-content px-6 py-8">{children}</main>
    </div>
  )
}
