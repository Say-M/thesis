FROM oven/bun:1 AS base

WORKDIR /usr/src/app

# Copy workspace metadata first for better cache
COPY package.json bun.lock ./
COPY packages ./packages
COPY . .

RUN bunx turbo prune auth-service --docker

RUN bun install --frozen-lockfile

WORKDIR /usr/src/app/apps/auth-service

EXPOSE 9000

CMD ["bun", "run", "src/index.ts"]
