import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuideEditor } from '@/components/admin/guides/GuideEditor'
import { GuideIllustrationCard } from '@/components/admin/GuideIllustrationCard'
import { capabilities } from '@/lib/capabilities'

export const metadata = {
  title: 'Edit guide — Admin',
  robots: 'noindex',
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminGuideEditPage({ params }: Props) {
  const { id } = await params

  const [guide, authorRows, topics, otherGuides, series] = await Promise.all([
    prisma.guide.findUnique({
      where: { id },
      include: {
        topics: true,
        prerequisites: true,
      },
    }),
    prisma.author.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.topic.findMany({ select: { id: true, slug: true, title: true }, orderBy: { title: 'asc' } }),
    prisma.guide.findMany({
      where: { id: { not: id }, deletedAt: null },
      select: { id: true, title: true, slug: true, type: true, status: true },
      orderBy: { title: 'asc' },
      take: 500,
    }),
    prisma.guideSeries.findMany({
      select: { id: true, slug: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ])

  if (!guide) notFound()

  const authors = authorRows.map(a => ({
    id: a.id,
    publicName: a.name,
    firstName: null,
    lastName: null,
    email: '',
  }))

  const pillarOptions = otherGuides.filter(g => g.type === 'pillar' && g.status === 'published')

  return (
    <>
      <div className="mb-4">
        <Link href="/admin/guides" className="text-text-dim hover:text-text text-[13px]">
          ← Back to guides
        </Link>
        <div className="flex items-baseline justify-between mt-2">
          <h1 className="font-head text-[24px] text-text">{guide.title}</h1>
          <div className="flex items-center gap-3 text-[12px] text-text-dim">
            <Link
              href={`/admin/guides/${guide.id}/analytics`}
              className="rounded-full border border-border px-3 py-1 hover:border-accent hover:text-accent"
            >
              Analytics →
            </Link>
            <span>Status: {guide.status}</span>
            <span>·</span>
            <span>Updated: {guide.updatedAt.toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>

      {capabilities.illustration && (
        <GuideIllustrationCard
          guideId={guide.id}
          heroImage={guide.heroImage}
          heroImageAlt={guide.heroImageAlt}
          alternativeImages={guide.alternativeImages as Parameters<typeof GuideIllustrationCard>[0]['alternativeImages']}
          illustrationMeta={guide.illustrationMeta as Parameters<typeof GuideIllustrationCard>[0]['illustrationMeta']}
        />
      )}

      <GuideEditor
        guide={{
          id: guide.id,
          title: guide.title,
          slug: guide.slug,
          metaTitle: guide.metaTitle ?? '',
          metaDescription: guide.metaDescription,
          excerpt: guide.excerpt,
          targetKeyword: guide.targetKeyword ?? '',
          type: guide.type,
          difficulty: guide.difficulty,
          content: guide.content,
          pillarId: guide.pillarId,
          seriesId: guide.seriesId,
          seriesOrder: guide.seriesOrder,
          authorId: guide.authorId,
          reviewedById: guide.reviewedById,
          sourceLessonId: null,
          isPinned: guide.isPinned,
          status: guide.status,
          ogImage: guide.ogImage,
          scheduledPublishAt: guide.scheduledPublishAt
            ? guide.scheduledPublishAt.toISOString().slice(0, 16)
            : null,
          heroPromise: guide.heroPromise,
          h1Variants: guide.h1Variants,
          requiredTools: guide.requiredTools,
          primaryCta: guide.primaryCta,
          changelogEntries: guide.changelogEntries,
          topicIds: guide.topics.map(t => t.topicId),
          prerequisiteIds: guide.prerequisites.map(p => p.prerequisiteId),
        }}
        authors={authors}
        topics={topics}
        otherGuides={otherGuides}
        pillarOptions={pillarOptions}
        series={series}
        lessons={[]}
      />
    </>
  )
}
