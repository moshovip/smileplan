import { siteConfig } from '@/site.config'

/**
 * Authorization for guide writes from the admin API.
 * Admins can do anything. In MULTI_AUTHOR mode a non-admin author may edit only
 * their own guides (where the session user id equals the guide's authorId).
 *
 * Returns `{ canEdit, isAdmin }` or `null` when access is denied.
 */
export async function checkGuideAccess(
  userId: string,
  isAdmin: boolean,
  authorId: string,
): Promise<{ canEdit: true; isAdmin: boolean } | null> {
  if (isAdmin) return { canEdit: true, isAdmin: true }
  if (!siteConfig.multiAuthor) return null
  if (authorId !== userId) return null
  return { canEdit: true, isAdmin: false }
}

/**
 * Authorization to read admin-only helper endpoints (preview, link-suggestions,
 * auto-link-concepts). Admin or — in MULTI_AUTHOR mode — any author.
 */
export async function checkEditorAccess(
  userId: string,
  isAdmin: boolean,
): Promise<{ ok: true; isAdmin: boolean } | null> {
  if (isAdmin) return { ok: true, isAdmin: true }
  if (!siteConfig.multiAuthor) return null
  return { ok: true, isAdmin: false }
}

/**
 * Fields a non-admin author may NOT change: authorship, reviewer, pillar links,
 * curated series, pinning.
 */
export const ADMIN_ONLY_GUIDE_FIELDS = [
  'authorId',
  'reviewedById',
  'pillarId',
  'seriesId',
  'seriesOrder',
  'isPinned',
] as const

export function stripAdminOnlyFields<T extends Record<string, unknown>>(body: T): T {
  const clone = { ...body }
  for (const k of ADMIN_ONLY_GUIDE_FIELDS) {
    if (k in clone) delete clone[k]
  }
  return clone
}
