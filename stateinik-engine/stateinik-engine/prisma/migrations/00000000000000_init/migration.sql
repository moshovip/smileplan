-- CreateEnum
CREATE TYPE "GuideType" AS ENUM ('pillar', 'tutorial', 'playbook', 'recipe');

-- CreateEnum
CREATE TYPE "GuideDifficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "GuideStatus" AS ENUM ('draft', 'scheduled', 'published', 'archived');

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "bio" TEXT,
    "avatar" TEXT,
    "socialLinks" JSONB,
    "email" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "heroPromise" JSONB,
    "h1Variants" JSONB,
    "targetKeyword" TEXT,
    "type" "GuideType" NOT NULL,
    "difficulty" "GuideDifficulty" NOT NULL DEFAULT 'intermediate',
    "content" TEXT NOT NULL,
    "contentHtml" TEXT,
    "contentTsv" tsvector,
    "rendererVersion" INTEGER NOT NULL DEFAULT 1,
    "pillarId" TEXT,
    "authorId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "seriesId" TEXT,
    "seriesOrder" INTEGER,
    "requiredTools" JSONB,
    "primaryCta" JSONB,
    "ogImage" TEXT,
    "heroImage" TEXT,
    "heroImageAlt" TEXT,
    "heroImageWidth" INTEGER,
    "heroImageHeight" INTEGER,
    "alternativeImages" JSONB,
    "illustrationMeta" JSONB,
    "readingMinutes" INTEGER NOT NULL DEFAULT 0,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "status" "GuideStatus" NOT NULL DEFAULT 'draft',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "changelogEntries" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideRevision" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideSlugHistory" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideStats" (
    "guideId" TEXT NOT NULL,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "bookmarksCount" INTEGER NOT NULL DEFAULT 0,
    "appliedCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "copyPromptCount" INTEGER NOT NULL DEFAULT 0,
    "ctaClickCount" INTEGER NOT NULL DEFAULT 0,
    "pogoStickCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideStats_pkey" PRIMARY KEY ("guideId")
);

-- CreateTable
CREATE TABLE "GuideFeedback" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "helpful" BOOLEAN NOT NULL,
    "comment" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideH1Stats" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "variantIndex" INTEGER NOT NULL,
    "showns" INTEGER NOT NULL DEFAULT 0,
    "converted" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideH1Stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBrokenLink" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideBrokenLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuidePrerequisite" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "GuidePrerequisite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideSeries" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "shortDefinition" TEXT NOT NULL,
    "longExplanation" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImage" TEXT,
    "authorId" TEXT,
    "status" "GuideStatus" NOT NULL DEFAULT 'draft',
    "scheduledPublishAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastReviewedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptSlugHistory" (
    "id" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "oldSlug" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConceptSlugHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideConceptMention" (
    "guideId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,

    CONSTRAINT "GuideConceptMention_pkey" PRIMARY KEY ("guideId","conceptId")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideTopic" (
    "guideId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "GuideTopic_pkey" PRIMARY KEY ("guideId","topicId")
);

-- CreateTable
CREATE TABLE "ConceptTopic" (
    "conceptId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "ConceptTopic_pkey" PRIMARY KEY ("conceptId","topicId")
);

-- CreateTable
CREATE TABLE "DigestSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'weekly',
    "source" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribeToken" TEXT NOT NULL,
    "lastDailySentAt" TIMESTAMP(3),
    "lastWeeklySentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigestSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guide_digest_issues" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "guide_ids" TEXT[],
    "body_telegram" TEXT,
    "body_email_html" TEXT,
    "subject" TEXT,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),

    CONSTRAINT "guide_digest_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConceptRelations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_slug_key" ON "Author"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Author_email_key" ON "Author"("email");

-- CreateIndex
CREATE INDEX "Author_deletedAt_idx" ON "Author"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");

-- CreateIndex
CREATE INDEX "Guide_status_publishedAt_idx" ON "Guide"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Guide_pillarId_idx" ON "Guide"("pillarId");

-- CreateIndex
CREATE INDEX "Guide_authorId_idx" ON "Guide"("authorId");

-- CreateIndex
CREATE INDEX "Guide_seriesId_seriesOrder_idx" ON "Guide"("seriesId", "seriesOrder");

-- CreateIndex
CREATE INDEX "Guide_scheduledPublishAt_idx" ON "Guide"("scheduledPublishAt");

-- CreateIndex
CREATE INDEX "Guide_deletedAt_idx" ON "Guide"("deletedAt");

-- CreateIndex
CREATE INDEX "GuideRevision_guideId_createdAt_idx" ON "GuideRevision"("guideId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuideSlugHistory_oldSlug_key" ON "GuideSlugHistory"("oldSlug");

-- CreateIndex
CREATE INDEX "GuideSlugHistory_guideId_idx" ON "GuideSlugHistory"("guideId");

-- CreateIndex
CREATE INDEX "GuideBookmark_userId_idx" ON "GuideBookmark"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideBookmark_userId_guideId_key" ON "GuideBookmark"("userId", "guideId");

-- CreateIndex
CREATE INDEX "GuideFeedback_guideId_idx" ON "GuideFeedback"("guideId");

-- CreateIndex
CREATE INDEX "GuideH1Stats_guideId_idx" ON "GuideH1Stats"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideH1Stats_guideId_variantIndex_key" ON "GuideH1Stats"("guideId", "variantIndex");

-- CreateIndex
CREATE INDEX "GuideBrokenLink_guideId_idx" ON "GuideBrokenLink"("guideId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideBrokenLink_guideId_url_key" ON "GuideBrokenLink"("guideId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "GuidePrerequisite_guideId_prerequisiteId_key" ON "GuidePrerequisite"("guideId", "prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideSeries_slug_key" ON "GuideSeries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Concept_slug_key" ON "Concept"("slug");

-- CreateIndex
CREATE INDEX "Concept_status_publishedAt_idx" ON "Concept"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Concept_scheduledPublishAt_idx" ON "Concept"("scheduledPublishAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptSlugHistory_oldSlug_key" ON "ConceptSlugHistory"("oldSlug");

-- CreateIndex
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DigestSubscriber_email_key" ON "DigestSubscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "DigestSubscriber_unsubscribeToken_key" ON "DigestSubscriber"("unsubscribeToken");

-- CreateIndex
CREATE INDEX "DigestSubscriber_frequency_idx" ON "DigestSubscriber"("frequency");

-- CreateIndex
CREATE INDEX "guide_digest_issues_status_idx" ON "guide_digest_issues"("status");

-- CreateIndex
CREATE UNIQUE INDEX "guide_digest_issues_period_period_key_key" ON "guide_digest_issues"("period", "period_key");

-- CreateIndex
CREATE UNIQUE INDEX "_ConceptRelations_AB_unique" ON "_ConceptRelations"("A", "B");

-- CreateIndex
CREATE INDEX "_ConceptRelations_B_index" ON "_ConceptRelations"("B");

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_pillarId_fkey" FOREIGN KEY ("pillarId") REFERENCES "Guide"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "GuideSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideRevision" ADD CONSTRAINT "GuideRevision_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideSlugHistory" ADD CONSTRAINT "GuideSlugHistory_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBookmark" ADD CONSTRAINT "GuideBookmark_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideStats" ADD CONSTRAINT "GuideStats_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideFeedback" ADD CONSTRAINT "GuideFeedback_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideH1Stats" ADD CONSTRAINT "GuideH1Stats_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBrokenLink" ADD CONSTRAINT "GuideBrokenLink_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidePrerequisite" ADD CONSTRAINT "GuidePrerequisite_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuidePrerequisite" ADD CONSTRAINT "GuidePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptSlugHistory" ADD CONSTRAINT "ConceptSlugHistory_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideConceptMention" ADD CONSTRAINT "GuideConceptMention_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideConceptMention" ADD CONSTRAINT "GuideConceptMention_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideTopic" ADD CONSTRAINT "GuideTopic_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideTopic" ADD CONSTRAINT "GuideTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptTopic" ADD CONSTRAINT "ConceptTopic_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptTopic" ADD CONSTRAINT "ConceptTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptRelations" ADD CONSTRAINT "_ConceptRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConceptRelations" ADD CONSTRAINT "_ConceptRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

