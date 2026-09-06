import Link from 'next/link'
import { routes } from '@/site.config'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-accent text-sm font-medium uppercase tracking-wider">404</p>
      <h1 className="font-head mt-3 text-3xl font-semibold text-text">Page not found</h1>
      <p className="mt-3 max-w-md text-text-sub">
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
        >
          Go home
        </Link>
        <Link
          href={routes.guides()}
          className="rounded-lg border border-border px-5 py-2.5 font-medium text-text transition hover:border-border-hover"
        >
          Browse guides
        </Link>
      </div>
    </main>
  )
}
