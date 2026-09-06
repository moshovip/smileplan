# Contributing to Stateinik

Thanks for your interest in improving Stateinik!

## Development setup

```bash
cp .env.example .env          # fill DATABASE_URL, AUTH_SECRET, ADMIN_*
npm install
npm run dev:seed              # apply migrations + load demo content
npm run dev
```

Or with Docker:

```bash
docker compose up -d db
docker compose --profile seed run --rm seed   # migrate + seed
docker compose up app
```

## Before opening a PR

Run the same checks CI runs:

```bash
npm run typecheck     # tsc --noEmit
npm run lint          # next lint
npm run build         # prisma generate && next build
```

All four must pass. The build also needs a reachable `DATABASE_URL` (a few pages prerender against the DB).

## Project layout

- `src/site.config.ts` — branding, routes, locale, enabled content types.
- `src/app/(content)/` — public pages. `src/app/admin/` — the admin.
- `src/components/mdx-blocks/` — the MDX block library. To add a block: create the component, register it in `index.ts`, and add its name to the whitelist in `src/lib/mdx/sanitize.ts`.
- `src/lib/` — content queries, MDX pipeline, SEO, auth facade.
- `prisma/schema.prisma` — the data model. The `*_fts` migration owns the full-text-search trigger.

## Adding an integration

Optional integrations (storage, AI, mailer, SEO sync, alerts) live behind small adapter interfaces and are off by default. Implement the interface, register it via an env switch, and have the feature no-op (and hide its admin UI) when the capability is disabled — see `src/lib/capabilities.ts`.

## Conventions

- TypeScript, no `any` where avoidable.
- Build URLs through the `routes` helpers in `site.config.ts`; never hardcode paths.
- User-facing strings are English by default; keep them translatable.
- Keep PRs focused. Describe the change and how you tested it.

## License

By contributing, you agree your contributions are licensed under the MIT License.
