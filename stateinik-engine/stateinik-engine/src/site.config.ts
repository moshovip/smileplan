/**
 * site.config.ts — the single source of truth for branding, routes, locale and
 * which content types are enabled. Everything an adopter needs to make Stateinik
 * "theirs" lives here. No business logic — config only.
 */

export type ContentType = "guides" | "concepts";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/** Which content types are active. Toggle via CONTENT_TYPES="guides,concepts". */
const enabledContentTypes = (process.env.CONTENT_TYPES || "guides,concepts")
  .split(",")
  .map((t) => t.trim())
  .filter((t): t is ContentType => t === "guides" || t === "concepts");

export const siteConfig = {
  /** Brand */
  name: process.env.SITE_NAME || "Stateinik",
  tagline:
    process.env.SITE_TAGLINE || "An open-source MDX article engine",
  description:
    process.env.SITE_DESCRIPTION ||
    "Guides, tutorials and a living glossary — authored in MDX, served fast.",
  url: APP_URL,

  /** Locale & search */
  defaultLocale: (process.env.DEFAULT_LOCALE || "en") as "en" | "ru",
  locales: ["en", "ru"] as const,
  /** Postgres full-text-search dictionary (must match the FTS migration).
   *  Validated against the stock pg_ts_config list so a typo or uninstalled
   *  dictionary can't throw a 500 on every search; unknown values fall back. */
  ftsLanguage: ((): string => {
    const KNOWN = new Set([
      "simple", "arabic", "armenian", "basque", "catalan", "danish", "dutch",
      "english", "finnish", "french", "german", "greek", "hindi", "hungarian",
      "indonesian", "irish", "italian", "lithuanian", "nepali", "norwegian",
      "portuguese", "romanian", "russian", "serbian", "spanish", "swedish",
      "tamil", "turkish", "yiddish",
    ]);
    const v = (process.env.FTS_LANGUAGE || "english").toLowerCase();
    return KNOWN.has(v) ? v : "english";
  })(),

  /** Content types enabled in this deployment. */
  contentTypes: enabledContentTypes,
  hasGuides: enabledContentTypes.includes("guides"),
  hasConcepts: enabledContentTypes.includes("concepts"),

  /** Multi-author mode lets non-admin authors manage only their own content. */
  multiAuthor: process.env.MULTI_AUTHOR === "true",

  /** Organization node for JSON-LD (schema.org). Fill in for richer SEO. */
  organization: {
    name: process.env.ORG_NAME || "Stateinik",
    legalName: process.env.ORG_LEGAL_NAME || "",
    url: APP_URL,
    logo: process.env.ORG_LOGO_URL || `${APP_URL}/logo.png`,
    sameAs: (process.env.ORG_SAME_AS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  },

  /** Route prefixes. Change these to localize URLs (e.g. /promty for Russian). */
  routePrefix: {
    guides: process.env.ROUTE_GUIDES || "/guides",
    concepts: process.env.ROUTE_CONCEPTS || "/concepts",
    authors: process.env.ROUTE_AUTHORS || "/authors",
    topics: process.env.ROUTE_TOPICS || "/guides/topic",
    series: process.env.ROUTE_SERIES || "/guides/series",
    search: process.env.ROUTE_SEARCH || "/search",
  },

  /** Primary navigation shown in the header. */
  nav: [
    { key: "guides", labelKey: "nav.guides", href: "/guides" },
    { key: "concepts", labelKey: "nav.concepts", href: "/concepts" },
    { key: "authors", labelKey: "nav.authors", href: "/authors" },
  ],

  /** Optional single call-to-action banner shown on content pages. */
  cta: {
    enabled: process.env.CTA_ENABLED === "true",
    label: process.env.CTA_LABEL || "",
    href: process.env.CTA_HREF || "",
  },
} as const;

/** Route helpers — always build URLs through these, never hardcode paths. */
export const routes = {
  home: () => "/",
  guides: () => siteConfig.routePrefix.guides,
  guide: (slug: string) => `${siteConfig.routePrefix.guides}/${slug}`,
  concepts: () => siteConfig.routePrefix.concepts,
  concept: (slug: string) => `${siteConfig.routePrefix.concepts}/${slug}`,
  authors: () => siteConfig.routePrefix.authors,
  author: (slug: string) => `${siteConfig.routePrefix.authors}/${slug}`,
  topic: (slug: string) => `${siteConfig.routePrefix.topics}/${slug}`,
  series: (slug: string) => `${siteConfig.routePrefix.series}/${slug}`,
  search: () => siteConfig.routePrefix.search,
};

export type SiteConfig = typeof siteConfig;
