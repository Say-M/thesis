# Use Bun as base image
FROM oven/bun:1.3.6-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy workspace root package files
COPY package.json bun.lock ./

COPY packages/common/package.json ./packages/common/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/utils/package.json ./packages/utils/

# Copy backend app package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages source (need for @repo/* imports)
COPY packages/common ./packages/common

# Copy backend app
COPY apps/backend ./apps/backend

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono
USER hono

COPY --from=builder --chown=hono:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=hono:nodejs /app/packages ./packages
COPY --from=builder --chown=hono:nodejs /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend

EXPOSE 9000

CMD ["bun", "run", "src/index.ts"]