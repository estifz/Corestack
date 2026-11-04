import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { DEPENDENCY_MAP } from './dependency-map.js'

export function transformDocker(config: ProjectConfig): void {
    const root = config.projectPath

    if (!config.includeDocker) {
        for (const relPath of DEPENDENCY_MAP.docker.filesToDelete) {
            const fullPath = path.join(root, relPath)
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true })
            }
        }
        return
    }

    const isPostgres = config.databaseProvider === 'postgres'
    const composeFile = path.join(root, 'compose.yaml')

    if (fs.existsSync(composeFile)) {
        let composeContent = ''

        const dbPort = config.dbPort ?? (isPostgres ? 5432 : 27017)

        if (isPostgres) {
            composeContent = `name: ${config.projectName}

services:
    postgres:
        image: postgres:16-alpine
        restart: unless-stopped
        environment:
            POSTGRES_USER: \${POSTGRES_USER}
            POSTGRES_PASSWORD: \${POSTGRES_PASSWORD}
            POSTGRES_DB: \${POSTGRES_DB}
        ports:
            - '${dbPort}:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test:
                [
                    'CMD-SHELL',
                    'pg_isready -U \${POSTGRES_USER} -d \${POSTGRES_DB}',
                ]
            interval: 5s
            timeout: 5s
            retries: 5

    app:
        build:
            context: .
            dockerfile: Dockerfile
        restart: unless-stopped
        ports:
            - '\${PORT:-3000}:3000'
        environment:
            PORT: 3000
            NODE_ENV: \${NODE_ENV}
            LOG_LEVEL: \${LOG_LEVEL}
            API_BASE_URL: \${API_BASE_URL}
            CORS_ORIGINS: \${CORS_ORIGINS}
            RATE_LIMIT_WINDOW: \${RATE_LIMIT_WINDOW}
            RATE_LIMIT_REQUEST: \${RATE_LIMIT_REQUEST}
            DATABASE_URL: postgresql://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}
            DATABASE_PROVIDER: postgres
`
            if (config.includeAuth) {
                composeContent += `            JWT_SECRET: \${JWT_SECRET}
            JWT_EXPIRES_IN: \${JWT_EXPIRES_IN}
            REFRESH_TOKEN_TTL_SECONDS: \${REFRESH_TOKEN_TTL_SECONDS}
            SESSION_TTL_SECONDS: \${SESSION_TTL_SECONDS}
            REFRESH_COOKIE_NAME: \${REFRESH_COOKIE_NAME}
            REFRESH_COOKIE_SAME_SITE: \${REFRESH_COOKIE_SAME_SITE}
            REFRESH_COOKIE_SECURE: \${REFRESH_COOKIE_SECURE}
            RESEND_API_KEY: \${RESEND_API_KEY}
            RESEND_FROM_EMAIL: \${RESEND_FROM_EMAIL}
            EMAIL_VERIFICATION_TTL_SECONDS: \${EMAIL_VERIFICATION_TTL_SECONDS}
            PASSWORD_RESET_TTL_SECONDS: \${PASSWORD_RESET_TTL_SECONDS}
`
            }

            composeContent += `        depends_on:
            postgres:
                condition: service_healthy

volumes:
    postgres_data:
`
        } else {
            // MongoDB
            const mongoExpressPort = config.mongoExpressPort ?? 8081

            composeContent = `name: ${config.projectName}

services:
    mongodb:
        image: mongo:7.0
        restart: unless-stopped
        ports:
            - '${dbPort}:27017'
        volumes:
            - mongodb_data:/data/db
        healthcheck:
            test: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")']
            interval: 5s
            timeout: 5s
            retries: 5

    mongo-express:
        image: mongo-express:latest
        restart: unless-stopped
        ports:
            - '${mongoExpressPort}:8081'
        environment:
            ME_CONFIG_MONGODB_SERVER: mongodb
            ME_CONFIG_MONGODB_PORT: 27017
            ME_CONFIG_BASICAUTH: 'false'
        depends_on:
            mongodb:
                condition: service_healthy

    app:
        build:
            context: .
            dockerfile: Dockerfile
        restart: unless-stopped
        ports:
            - '\${PORT:-3000}:3000'
        environment:
            PORT: 3000
            NODE_ENV: \${NODE_ENV}
            LOG_LEVEL: \${LOG_LEVEL}
            API_BASE_URL: \${API_BASE_URL}
            CORS_ORIGINS: \${CORS_ORIGINS}
            RATE_LIMIT_WINDOW: \${RATE_LIMIT_WINDOW}
            RATE_LIMIT_REQUEST: \${RATE_LIMIT_REQUEST}
            DATABASE_PROVIDER: mongodb
            MONGODB_URI: mongodb://mongodb:27017/${config.projectName}
`
            if (config.includeAuth) {
                composeContent += `            JWT_SECRET: \${JWT_SECRET}
            JWT_EXPIRES_IN: \${JWT_EXPIRES_IN}
            REFRESH_TOKEN_TTL_SECONDS: \${REFRESH_TOKEN_TTL_SECONDS}
            SESSION_TTL_SECONDS: \${SESSION_TTL_SECONDS}
            REFRESH_COOKIE_NAME: \${REFRESH_COOKIE_NAME}
            REFRESH_COOKIE_SAME_SITE: \${REFRESH_COOKIE_SAME_SITE}
            REFRESH_COOKIE_SECURE: \${REFRESH_COOKIE_SECURE}
            RESEND_API_KEY: \${RESEND_API_KEY}
            RESEND_FROM_EMAIL: \${RESEND_FROM_EMAIL}
            EMAIL_VERIFICATION_TTL_SECONDS: \${EMAIL_VERIFICATION_TTL_SECONDS}
            PASSWORD_RESET_TTL_SECONDS: \${PASSWORD_RESET_TTL_SECONDS}
`
            }

            composeContent += `        depends_on:
            mongodb:
                condition: service_healthy

volumes:
    mongodb_data:
`
        }

        fs.writeFileSync(composeFile, composeContent, 'utf-8')
    }

    // Adapt docker-entrypoint.sh if MongoDB
    if (!isPostgres) {
        const entrypointFile = path.join(root, 'docker-entrypoint.sh')
        if (fs.existsSync(entrypointFile)) {
            const entrypointContent = `#!/bin/sh
set -e

exec "$@"
`
            fs.writeFileSync(entrypointFile, entrypointContent, { mode: 0o755 })
        }
    }

    // Generate minimal, production Dockerfile tailored to package manager and database
    const dockerfilePath = path.join(root, 'Dockerfile')
    if (fs.existsSync(dockerfilePath)) {
        fs.writeFileSync(
            dockerfilePath,
            generateMinimalDockerfile(config),
            'utf-8',
        )
    }
}

function generateMinimalDockerfile(config: ProjectConfig): string {
    const isPostgres = config.databaseProvider === 'postgres'
    const pm = config.packageManager

    const opensslLine = isPostgres
        ? 'RUN apk add --no-cache libc6-compat openssl\n\n'
        : ''

    if (pm === 'bun') {
        return `FROM oven/bun:1-alpine
WORKDIR /app

${opensslLine}COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN chmod +x ./docker-entrypoint.sh
RUN bun run build

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "dist/server.js"]
`
    }

    if (pm === 'pnpm') {
        return `FROM node:24-alpine
WORKDIR /app

${opensslLine}RUN npm install -g pnpm@11.15.1 --force
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install

COPY . .
RUN chmod +x ./docker-entrypoint.sh
RUN pnpm build

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
`
    }

    if (pm === 'yarn') {
        return `FROM node:24-alpine
WORKDIR /app

${opensslLine}COPY package.json yarn.lock* ./
RUN yarn install

COPY . .
RUN chmod +x ./docker-entrypoint.sh
RUN yarn build

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
`
    }

    // Default: npm
    return `FROM node:24-alpine
WORKDIR /app

${opensslLine}COPY package*.json ./
RUN npm install

COPY . .
RUN chmod +x ./docker-entrypoint.sh
RUN npm run build

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
`
}
