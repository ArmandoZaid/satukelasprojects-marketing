# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Secrets are supplied only at runtime, never as build arguments.
ENV NODE_ENV=production
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    USE_SECURE_COOKIES=true \
    MARKETING_ENABLE_DEMO_AUTH=false \
    MARKETING_ENABLE_SYNTHETIC_CRM=false \
    MARKETING_ENABLE_ADMIN_PREVIEW=false
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs migrations ./migrations
COPY --chown=nextjs:nodejs src/lib/db/config.mjs ./src/lib/db/config.mjs
COPY --chown=nextjs:nodejs scripts/container-config.mjs scripts/container-start.mjs scripts/container-healthcheck.mjs scripts/db-migrate.mjs scripts/db-bootstrap.mjs ./scripts/
USER nextjs:nodejs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD ["node", "scripts/container-healthcheck.mjs"]
CMD ["node", "scripts/container-start.mjs"]
