'use client'

import { useState, useEffect } from 'react'
import { List, X } from 'lucide-react'
import type { TocEntry } from '@/lib/mdx/extract'

export function GuideTocFloating({ toc }: { toc: TocEntry[] }) {
  const [open, setOpen] = useState(false)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    function onScroll() {
      const items = toc
        .map((t) => {
          const el = document.getElementById(t.slug)
          if (!el) return null
          return { slug: t.slug, top: el.getBoundingClientRect().top }
        })
        .filter((x): x is { slug: string; top: number } => x !== null)
      const passed = items.filter((i) => i.top <= 120)
      const current = passed.length > 0 ? passed[passed.length - 1] : items[0]
      if (current) setActiveSlug(current.slug)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [toc])

  if (!toc || toc.length === 0) return null

  function onJump(slug: string) {
    const el = document.getElementById(slug)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Table of contents"
        className="fixed bottom-32 left-4 md:bottom-4 z-30 inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent text-bg shadow-[0_8px_30px_rgba(217,119,87,0.4)] hover:bg-accent-hover transition-colors"
      >
        <List size={20} strokeWidth={2} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Table of contents"
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" aria-hidden="true" />
          <div
            className="relative w-full max-w-md max-h-[85vh] overflow-auto rounded-t-2xl sm:rounded-2xl border border-border bg-bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-head text-xl text-text">Table of contents</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-text-sub hover:text-text hover:bg-bg-card-hover transition-colors"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>
            <ul className="space-y-1">
              {toc.map((t) => (
                <li key={t.slug}>
                  <button
                    type="button"
                    onClick={() => onJump(t.slug)}
                    className={`block w-full text-left px-3 py-2 rounded-lg text-[14px] transition-colors ${
                      t.level === 3 ? 'pl-6 text-text-sub' : 'text-text'
                    } ${activeSlug === t.slug ? 'bg-accent-soft text-accent' : 'hover:bg-bg-card-hover'}`}
                  >
                    {t.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
