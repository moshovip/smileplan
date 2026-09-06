import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { jsonLdScript } from '@/lib/seo/json-ld-script'
import { siteConfig, routes } from '@/site.config'
import { GuideCard } from '@/components/guides/GuideCard'
import { GuideAuthorCard } from '@/components/guides/GuideAuthorCard'
import { buildAuthorJsonLd } from '@/lib/authors/json-ld'
import { buildOrganizationJsonLd } from '@/lib/organization/json-ld'
import { buildBreadcrumb } from '@/lib/seo/breadcrumb'

export const revalidate = 3600

const APP_URL = siteConfig.url

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const author = await prisma.author.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true, title: true, bio: true, avatar: true },
  })
  if (!author) return { title: `Author not found — ${siteConfig.name}` }
  const title = `${author.name ?? 'Author'} — ${siteConfig.name}`
  const description = author.title ?? `Author on ${siteConfig.name}.`
  const ogImage = author.avatar
    ? author.avatar.startsWith('http')
      ? author.avatar
      : `${APP_URL}${author.avatar}`
    : `${APP_URL}/og/quote?text=${encodeURIComponent(author.name ?? 'Author')}&author=${encodeURIComponent(siteConfig.name)}`
  return {
    title,
    description,
    alternates: { canonical: routes.author(slug) },
    openGraph: {
      title,
      description,
      url: `${APP_URL}${routes.author(slug)}`,
      siteName: siteConfig.name,
      type: 'profile',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default async function AuthorPage({ params }: PageProps) {
  const { slug } = await params
  const author = await prisma.author.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      name: true,
      title: true,
      bio: true,
      avatar: true,
      slug: true,
      socialLinks: true,
    },
  })
  if (!author || !author.slug) notFound()

  const [guides, topicAggregates] = await Promise.all([
    prisma.guide.findMany({
      where: { authorId: author.id, status: 'published', deletedAt: null },
      include: { stats: { select: { viewsCount: true } } },
      orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
      take: 48,
    }),
    prisma.topic.findMany({
      where: {
        guides: {
          some: {
            guide: {
              is: { authorId: author.id, status: 'published', deletedAt: null },
            },
          },
        },
      },
      select: { title: true },
    }),
  ])

  const url = `${APP_URL}${routes.author(author.slug)}`

  const personJsonLd = buildAuthorJsonLd({
    slug: author.slug,
    name: author.name,
    title: author.title,
    bio: author.bio,
    avatar: author.avatar,
    socialLinks: (author.socialLinks as unknown) ?? null,
    knowsAbout: topicAggregates.map((t) => t.title),
  })

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      personJsonLd,
      buildOrganizationJsonLd(),
      buildBreadcrumb(
        [
          { name: 'Guides', url: `${APP_URL}${routes.guides()}` },
          { name: 'Authors', url: `${APP_URL}${routes.authors()}` },
          { name: author.name ?? 'Author', url },
        ],
        url,
      ),
    ],
  }

  return (
    <div className="max-w-content mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(graph) }}
      />
      <GuideAuthorCard
        author={{
          slug: author.slug,
          name: author.name,
          title: author.title,
          bio: author.bio,
          avatar: author.avatar,
          socialLinks: (author.socialLinks as unknown) ?? null,
        }}
      />

      <h2 className="font-head text-2xl sm:text-3xl text-text mb-6">Guides by {author.name}</h2>
      {guides.length === 0 ? (
        <p className="text-text-sub py-8">No published guides yet.</p>
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
