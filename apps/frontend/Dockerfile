# Use Bun as base image
FROM oven/bun:1.3.6-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy all workspace package.json files for dependency resolution
COPY packages/common/package.json ./packages/common/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Copy frontend app package.json
COPY apps/frontend/package.json ./apps/frontend/

# Install dependencies
RUN bun install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages source (need for @repo/* imports)
COPY packages ./packages

# Copy frontend app
COPY apps/frontend ./apps/frontend

ENV NEXT_TELEMETRY_DISABLED=1

# Build from app directory; Node resolves deps from /app/node_modules
WORKDIR /app/apps/frontend
RUN bun --bun next build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/apps/frontend/public ./public
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["bun", "apps/frontend/server.js"]
