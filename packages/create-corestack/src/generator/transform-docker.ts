import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider } from '../types.js'

export async function transformDocker(
    targetDir: string,
    options: { docker: boolean; database: DatabaseProvider; auth: boolean },
): Promise<void> {
    const { docker, database, auth } = options

    if (!docker) {
        await fs.remove(path.join(targetDir, 'Dockerfile'))
        await fs.remove(path.join(targetDir, '.dockerignore'))
        await fs.remove(path.join(targetDir, 'compose.yaml'))
        return
    }

    const composePath = path.join(targetDir, 'compose.yaml')

    let dbServices = ''
    let appDbEnv = ''
    let appDependsOn = ''
    let volumes = ''

    if (database === 'postgres') {
        dbServices = `    postgres:
        image: postgres:16-alpine
        restart: unless-stopped
        environment:
            POSTGRES_USER: \${POSTGRES_USER:-postgres}
            POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-password}
            POSTGRES_DB: \${POSTGRES_DB:-corestack}
        ports:
            - '5432:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test:
                [
                    'CMD-SHELL',
                    'pg_isready -U \${POSTGRES_USER:-postgres} -d \${POSTGRES_DB:-corestack}',
                ]
            interval: 5s
            timeout: 5s
            retries: 5
`
        appDbEnv = `            DATABASE_URL: postgresql://\${POSTGRES_USER:-postgres}:\${POSTGRES_PASSWORD:-password}@postgres:5432/\${POSTGRES_DB:-corestack}`
        appDependsOn = `        depends_on:
            postgres:
                condition: service_healthy`
        volumes = `volumes:
    postgres_data:
`
    } else {
        dbServices = `    mongodb:
        image: mongo:7.0
        restart: unless-stopped
        ports:
            - '27017:27017'
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
`
        appDbEnv = `            MONGODB_URI: \${MONGODB_URI:-mongodb://mongodb:27017/corestack}`
        appDependsOn = `        depends_on:
            mongodb:
                condition: service_healthy`
        volumes = `volumes:
    mongodb_data:
`
    }

    let authEnvs = ''
    if (auth) {
        authEnvs = `            JWT_SECRET: \${JWT_SECRET:-replace-with-a-long-random-secret-at-least-32-chars}
            JWT_EXPIRES_IN: \${JWT_EXPIRES_IN:-15m}
            REFRESH_TOKEN_TTL_SECONDS: \${REFRESH_TOKEN_TTL_SECONDS:-604800}
            SESSION_TTL_SECONDS: \${SESSION_TTL_SECONDS:-2592000}
            REFRESH_COOKIE_NAME: \${REFRESH_COOKIE_NAME:-refresh_token}
            REFRESH_COOKIE_SAME_SITE: \${REFRESH_COOKIE_SAME_SITE:-lax}
            REFRESH_COOKIE_SECURE: \${REFRESH_COOKIE_SECURE:-false}
            RESEND_API_KEY: \${RESEND_API_KEY:-}
            RESEND_FROM_EMAIL: \${RESEND_FROM_EMAIL:-CoreStack <onboarding@resend.dev>}
            EMAIL_VERIFICATION_TTL_SECONDS: \${EMAIL_VERIFICATION_TTL_SECONDS:-86400}
            PASSWORD_RESET_TTL_SECONDS: \${PASSWORD_RESET_TTL_SECONDS:-900}
`
    }

    const composeContent = `name: corestack

services:
${dbServices}
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
${appDbEnv}
${authEnvs}${appDependsOn}

${volumes}`

    await fs.writeFile(composePath, composeContent, 'utf-8')
}
