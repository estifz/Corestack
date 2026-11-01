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
            POSTGRES_USER: \${POSTGRES_USER:-postgres}
            POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-password}
            POSTGRES_DB: \${POSTGRES_DB:-${config.projectName}}
        ports:
            - '${dbPort}:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test:
                [
                    'CMD-SHELL',
                    'pg_isready -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-${config.projectName}}',
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
            PORT: '3000'
            NODE_ENV: \${NODE_ENV:-development}
            LOG_LEVEL: \${LOG_LEVEL:-info}
            API_BASE_URL: \${API_BASE_URL:-http://localhost:3000}
            CORS_ORIGINS: \${CORS_ORIGINS:-http://localhost:3000}
            RATE_LIMIT_WINDOW: \${RATE_LIMIT_WINDOW:-60000}
            RATE_LIMIT_REQUEST: \${RATE_LIMIT_REQUEST:-100}
            DATABASE_URL: postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD:-password}@postgres:5432/\${POSTGRES_DB:-${config.projectName}}
            DATABASE_PROVIDER: postgres
`
            if (config.includeAuth) {
                composeContent += `            JWT_SECRET: \${JWT_SECRET:-replace-with-a-long-random-secret-at-least-32-chars}
            JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-15m}
            REFRESH_TOKEN_TTL_SECONDS: \${REFRESH_TOKEN_TTL_SECONDS:-604800}
            SESSION_TTL_SECONDS: \${SESSION_TTL_SECONDS:-2592000}
            REFRESH_COOKIE_NAME: \${REFRESH_COOKIE_NAME:-refresh_token}
            REFRESH_COOKIE_SAME_SITE: \${REFRESH_COOKIE_SAME_SITE:-lax}
            REFRESH_COOKIE_SECURE: \${REFRESH_COOKIE_SECURE:-false}
            RESEND_API_KEY: \${RESEND_API_KEY:-}
            RESEND_FROM_EMAIL: \${RESEND_FROM_EMAIL:-${config.projectName} <no-reply@example.com>}
            EMAIL_VERIFICATION_TTL_SECONDS: \${EMAIL_VERIFICATION_TTL_SECONDS:-86400}
            PASSWORD_RESET_TTL_SECONDS: \${PASSWORD_RESET_TTL_SECONDS:-900}
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
            - '8081:8081'
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
            PORT: '3000'
            NODE_ENV: \${NODE_ENV:-development}
            LOG_LEVEL: \${LOG_LEVEL:-info}
            API_BASE_URL: \${API_BASE_URL:-http://localhost:3000}
            CORS_ORIGINS: \${CORS_ORIGINS:-http://localhost:3000}
            RATE_LIMIT_WINDOW: \${RATE_LIMIT_WINDOW:-60000}
            RATE_LIMIT_REQUEST: \${RATE_LIMIT_REQUEST:-100}
            DATABASE_PROVIDER: mongodb
            MONGODB_URI: \${MONGODB_URI:-mongodb://mongodb:27017/${config.projectName}}
`
            if (config.includeAuth) {
                composeContent += `            JWT_SECRET: \${JWT_SECRET:-replace-with-a-long-random-secret-at-least-32-chars}
            JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-15m}
            REFRESH_TOKEN_TTL_SECONDS: \${REFRESH_TOKEN_TTL_SECONDS:-604800}
            SESSION_TTL_SECONDS: \${SESSION_TTL_SECONDS:-2592000}
            REFRESH_COOKIE_NAME: \${REFRESH_COOKIE_NAME:-refresh_token}
            REFRESH_COOKIE_SAME_SITE: \${REFRESH_COOKIE_SAME_SITE:-lax}
            REFRESH_COOKIE_SECURE: \${REFRESH_COOKIE_SECURE:-false}
            RESEND_API_KEY: \${RESEND_API_KEY:-}
            RESEND_FROM_EMAIL: \${RESEND_FROM_EMAIL:-${config.projectName} <no-reply@example.com>}
            EMAIL_VERIFICATION_TTL_SECONDS: \${EMAIL_VERIFICATION_TTL_SECONDS:-86400}
            PASSWORD_RESET_TTL_SECONDS: \${PASSWORD_RESET_TTL_SECONDS:-900}
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
}
