import type { ReactNode } from 'react'
import { Header } from '@/components/chrome/Header'
import { Footer } from '@/components/chrome/Footer'

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg text-text">{children}</main>
      <Footer />
    </>
  )
}
