# Use Bun as base image
FROM oven/bun:1.3.6-alpine AS base
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps

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

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy workspace packages source (need for @repo/* imports)
COPY packages ./packages

# Copy frontend app
COPY apps/frontend ./apps/frontend

# Set environment variables for build
ENV OUTPUT_TRACING_ROOT=/app
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js application directly (not using turbo for docker builds)
WORKDIR /app/apps/frontend

# Create symlink to node_modules at workspace root so Next.js can find dependencies
RUN ln -s /app/node_modules ./node_modules

# Build with bun
RUN bun --bun next build

# Production image, copy all the files and run next
FROM base AS runner

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/frontend/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
# ENV HOSTNAME="0.0.0.0"
CMD ["bun", "apps/frontend/server.js"]