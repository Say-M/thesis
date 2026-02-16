FROM oven/bun:1 AS base

WORKDIR /usr/src/app

# Copy workspace metadata and packages
COPY package.json bun.lock ./
COPY packages ./packages
COPY apps ./apps

# Install all dependencies (workspace-aware)
RUN bun install

# Backend service
WORKDIR /usr/src/app/apps/backend

EXPOSE 9000

CMD ["bun", "run", "start"]
