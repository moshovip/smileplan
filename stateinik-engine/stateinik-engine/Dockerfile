# syntax=docker/dockerfile:1

# ---- deps ----
FROM node:20-alpine AS deps
WORKDIR /app
# OpenSSL so the @prisma/engines postinstall (during `npm ci`) detects libssl 3
# and fetches the openssl-3.0.x engines; without it Prisma grabs 1.1.x engines
# that fail to load at runtime ("Could not parse schema engine response").
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
# The postinstall hook runs `prisma generate`, which needs the schema — copy it
# in before `npm ci` so the deps stage installs without "schema.prisma not found".
COPY prisma ./prisma
RUN npm ci

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `next build` never *connects* to Postgres — every route is dynamic, so no query
# runs at build time. But PrismaClient is constructed at module load and requires
# DATABASE_URL to be present, so we hand it a throwaway value. The real connection
# string is injected at runtime by the `app` service (this stage isn't shipped).
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# OpenSSL for the Prisma engine at runtime (migrate deploy + query engine).
RUN apk add --no-cache openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone server + static assets + public dir
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engine + schema/migrations for `migrate deploy` at startup
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
