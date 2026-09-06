import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { siteConfig, routes } from '@/site.config'
import { GuideCard } from '@/components/guides/GuideCard'

export const revalidate = 3600

const APP_URL = siteConfig.url

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const topic = await prisma.topic.findUnique({ where: { slug }, select: { title: true, description: true } })
  if (!topic) return { title: `Topic not found — ${siteConfig.name}` }
  const title = `Guides on “${topic.title}” — ${siteConfig.name}`
  return {
    title,
    description: topic.description ?? `${siteConfig.name} guides on “${topic.title}”.`,
    alternates: { canonical: routes.topic(slug) },
    openGraph: {
      title,
      description: topic.description ?? undefined,
      url: `${APP_URL}${routes.topic(slug)}`,
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const topic = await prisma.topic.findUnique({ where: { slug } })
  if (!topic) notFound()

  const guides = await prisma.guide.findMany({
    where: {
      status: 'published',
      deletedAt: null,
      topics: { some: { topicId: topic.id } },
    },
    include: { stats: { select: { viewsCount: true } } },
    orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    take: 48,
  })

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-accent text-[11px] font-semibold uppercase tracking-[0.15em] mb-3">Topic</p>
        <h1 className="font-head text-[clamp(36px,5.5vw,56px)] text-text leading-[1.1] tracking-tight">
          Guides on: {topic.title}
        </h1>
        {topic.description && (
          <p className="mt-4 text-text-sub text-lg max-w-narrow">{topic.description}</p>
        )}
      </header>

      {guides.length === 0 ? (
        <p className="text-text-sub text-lg py-16 text-center">
          No guides in this topic yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map((g) => (
            <GuideCard
              key={g.id}
              guide={{
                slug: g.slug,
                title: g.title,
                excerpt: g.excerpt,
                ogImage: g.ogImage, heroImage: g.heroImage,
                readingMinutes: g.readingMinutes,
                viewsCount: g.stats?.viewsCount ?? 0,
                publishedAt: g.publishedAt,
                isPinned: g.isPinned,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
