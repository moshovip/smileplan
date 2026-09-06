import Link from 'next/link'
import { SeriesForm } from '../[id]/series-form'

export const metadata = {
  title: 'New series — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

export default function NewSeriesPage() {
  return (
    <>
      <div className="mb-6">
        <Link href="/admin/series" className="text-text-dim hover:text-text text-[13px]">
          ← Back to list
        </Link>
        <h1 className="font-head text-[28px] text-text mt-2">New series</h1>
      </div>

      <SeriesForm mode="create" guides={[]} />
    </>
  )
}
