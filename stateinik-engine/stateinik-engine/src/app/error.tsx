'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-accent text-sm font-medium uppercase tracking-wider">Something went wrong</p>
      <h1 className="font-head mt-3 text-3xl font-semibold text-text">An unexpected error occurred</h1>
      <p className="mt-3 max-w-md text-text-sub">
        Try again, or head back home. If this keeps happening, check the server logs.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-bg transition hover:bg-accent-hover"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 font-medium text-text transition hover:border-border-hover"
        >
          Go home
        </a>
      </div>
    </main>
  )
}
