# Stateinik

> An open-source MDX article engine — a production-grade guides/blog CMS you can clone and deploy on your own site.

Stateinik is the content engine behind a real, organic-traffic publication, extracted and made reusable. It is **not** a starter template — it is a complete, opinionated system for publishing rich technical articles and a cross-linked glossary, with everything that actually moves the needle on an SEO site already built in.

![status](https://img.shields.io/badge/status-beta-orange) ![license](https://img.shields.io/badge/license-MIT-blue)

## What you get

- **MDX authoring** with ~25 ready-made content blocks — callouts, step lists, FAQ, comparison tables, code with [Shiki](https://shiki.style) highlighting, [Mermaid](https://mermaid.js.org) diagrams, sources, TL;DR, stats, definition links and more.
- **Two content types on one engine** — long-form **Guides** and a cross-linked **Concept** glossary. Toggle either via `CONTENT_TYPES`.
- **Editorial workflow** — 30-second autosave revisions, restore-from-revision, slug history with permanent redirects, live MDX preview, an SEO scorer, an auto-link-concepts pass and a structural quality gate.
- **SEO arsenal** — per-type JSON-LD `@graph` (Article / FAQPage / HowTo / Person / Organization / BreadcrumbList), dynamic OG images, `sitemap.xml`, `robots.txt`, `llms.txt` / `llms-full.txt`, IndexNow ping on publish, a broken-link checker and a freshness watcher.
- **Postgres full-text search** with a weighted `tsvector` index across all content.
- **Engagement & analytics** — per-article view/copy/share/CTA counters, helpful-votes feedback, **A/B headline testing**, reading progress, a floating table of contents, and a per-article dashboard.
- **Single-admin auth + a full admin** — log in, write, schedule, publish; manage authors, series and topics.
- **Optional, pluggable integrations** (all off by default) — S3/local object storage, AI hero-image generation, AI transcript→draft, email digest, Google Search Console sync, admin alerts.

## Stack

Next.js 14 (App Router) · React 18 · Prisma · PostgreSQL · Tailwind CSS · `next-mdx-remote`.

## Quick start

### Local (Node + your own Postgres)

```bash
cp .env.example .env          # set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run dev:seed              # apply migrations + load demo content
npm run dev
```

Open <http://localhost:3000>. The admin is at `/admin` (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

### Docker (one command)

```bash
docker compose up -d db
docker compose --profile seed run --rm seed   # migrate + load demo content
docker compose up app
```

## Configuration

Everything brandable lives in [`src/site.config.ts`](src/site.config.ts) — name, tagline, organization JSON-LD, route prefixes, navigation, default locale, enabled content types. The full env surface is in [`.env.example`](.env.example).

### Required

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the site |
| `AUTH_SECRET` | Signs the admin session cookie (≥ 32 chars) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Single-admin login |

A bare deploy needs only these.

### Capability matrix (all optional, off by default)

| Capability | Enable with | Without it |
|---|---|---|
| Redis cache / rate-limit store | `REDIS_URL` | in-memory fallback |
| Object storage (hero images) | `STORAGE_DRIVER=s3` + `S3_*` | local `/public` |
| AI hero illustration | `IMAGE_PROVIDER` + `GEMINI_API_KEY` + an `ImageProvider` | admin card returns 501 |
| AI transcript → draft | `LLM_PROVIDER` + `OPENROUTER_API_KEY` | feature hidden |
| IndexNow ping on publish | `INDEXNOW_KEY` (+ `public/<key>.txt`) | no-op |
| Google Search Console sync | `GSC_*` | no-op |
| Email digest | `DIGEST_ENABLED=true` + `MAILER_DRIVER=resend` + `RESEND_API_KEY` | no-op |
| Admin alerts | `ADMIN_ALERT_DRIVER=telegram\|webhook` | logged to console |
| Cron endpoints | `CRON_SECRET` (Bearer) | return 401 |

### Localization

`DEFAULT_LOCALE` and `FTS_LANGUAGE` set the default language. The UI ships English-first; Cyrillic content is fully supported (slugs, search). To localize route URLs (e.g. `/articles` instead of `/guides`), set the `ROUTE_*` vars **and** rename the matching folders under `src/app/(content)/` to keep the filesystem routes in sync with `routePrefix`.

## Extending

### Add an MDX block

1. Create the component in `src/components/mdx-blocks/`.
2. Register it in `src/components/mdx-blocks/index.ts`.
3. Add its name to the whitelist in `src/lib/mdx/sanitize.ts`.
4. Optionally add a snippet to the editor palette in `src/components/admin/guides/MdxEditor.tsx`.

### Swap an adapter

Optional integrations sit behind small seams gated by `src/lib/capabilities.ts`. To wire one (e.g. AI illustration), implement the provider, flip its env switch, and the feature lights up — no core changes. Admin auth is a facade in `src/lib/auth-helpers.ts`; implement the same four functions against NextAuth or your own provider to support multiple users.

### Theming

The default warm-dark theme is defined by the tokens in [`tailwind.config.ts`](tailwind.config.ts) and the CSS variables in `src/app/globals.css`. The token **names** are the stable contract; change the values to re-skin.

## Project layout

```
src/
├── app/(content)/   public pages          app/admin/   the admin
├── app/api/         analytics · cron · admin write API · auth
├── components/      mdx-blocks · content · admin · chrome
├── lib/             prisma · mdx pipeline · content queries · seo · auth · capabilities
├── site.config.ts   branding · routes · locale · content types
prisma/              schema + migrations (the *_fts migration owns the FTS trigger)
scripts/seed.ts      demo content
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Run `npm run typecheck && npm run lint && npm run build` before a PR — the same checks CI runs.

## License

MIT — see [LICENSE](LICENSE).
