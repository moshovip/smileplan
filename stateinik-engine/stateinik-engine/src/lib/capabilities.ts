/**
 * Capability registry. Every optional integration is gated here by env, so a
 * feature can no-op (and its admin UI can hide) when it isn't configured.
 * A bare deploy needs only DATABASE_URL + AUTH_SECRET + NEXT_PUBLIC_APP_URL.
 */

function has(v: string | undefined): boolean {
  return !!v && v.trim().length > 0
}

export const capabilities = {
  /** S3-compatible object storage for hero images (else local /public). */
  objectStorage: (process.env.STORAGE_DRIVER || 'local') === 's3' && has(process.env.S3_BUCKET),
  /** AI hero-illustration generation. */
  illustration: (process.env.IMAGE_PROVIDER || 'none') !== 'none' && has(process.env.GEMINI_API_KEY),
  /** AI transcript -> guide draft. */
  transcriptImport: (process.env.LLM_PROVIDER || 'none') !== 'none' && has(process.env.OPENROUTER_API_KEY),
  /** IndexNow ping on publish (Bing/Yandex/Seznam). */
  indexNow: has(process.env.INDEXNOW_KEY),
  /** Google Search Console search-query sync. */
  gscSync: has(process.env.GSC_REFRESH_TOKEN) && has(process.env.GSC_SITE_URL),
  /** Email digest newsletter. */
  digest: process.env.DIGEST_ENABLED === 'true',
} as const

export type Capability = keyof typeof capabilities

export const mailerDriver = process.env.MAILER_DRIVER || 'console'
export const adminAlertDriver = process.env.ADMIN_ALERT_DRIVER || 'console'
export const analyticsDriver = process.env.ANALYTICS_DRIVER || 'internal'
