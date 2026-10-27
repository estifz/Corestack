# Stage 1: Base image with pnpm
FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@11.15.1 --force
WORKDIR /app

# Stage 2: Install dependencies
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

ENV CI=true
RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-timeout 600000

# Cache pnpm store across builds
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Stage 3: Build application and prune devDependencies
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate database client if prisma is configured
RUN if [ -f prisma/schema.prisma ]; then ./node_modules/.bin/prisma generate --no-hints; fi

# Compile TypeScript to dist/
RUN pnpm build

# Prune devDependencies in-place without triggering lifecycle scripts
RUN pnpm prune --prod --ignore-scripts

# Stage 4: Lean production runner
FROM node:24-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production

# Run with non-root user for security
USER node

# Copy production node_modules, compiled dist, and package metadata
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
