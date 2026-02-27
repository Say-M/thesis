# Use Bun as base image
FROM oven/bun:1.3.6-alpine AS base
WORKDIR /app

# ---
FROM base AS prepare
RUN bun add --global turbo
COPY . .
RUN turbo prune backend --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS builder
WORKDIR /app

# First install dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN bun install

# Build the project and its dependencies
COPY --from=prepare /app/out/full/ .

# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM

# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN

RUN bun turbo build

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 hono
RUN adduser --system --uid 1001 hono
USER hono
COPY --from=builder /app .

CMD ["bun", "apps/backend/src/index.ts"]