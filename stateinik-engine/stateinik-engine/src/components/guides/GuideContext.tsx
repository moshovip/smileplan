'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface GuideContextValue {
  slug: string
  id: string
}

const GuideCtx = createContext<GuideContextValue | null>(null)

export function GuideProvider({
  slug,
  id,
  children,
}: {
  slug: string
  id: string
  children: ReactNode
}) {
  return <GuideCtx.Provider value={{ slug, id }}>{children}</GuideCtx.Provider>
}

export function useGuideContext(): GuideContextValue | null {
  return useContext(GuideCtx)
}
