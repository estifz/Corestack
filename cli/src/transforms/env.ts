import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'

export function transformEnv(config: ProjectConfig): void {
    const root = config.projectPath
    const isPostgres = config.databaseProvider === 'postgres'

    // 1. Build .env.example content
    let envContent = `# Server & Runtime
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
API_BASE_URL=http://localhost:3000

# Security & CORS
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_REQUEST=100

# Database
DATABASE_PROVIDER=${config.databaseProvider}
`
    const dbPort = config.dbPort ?? (isPostgres ? 5432 : 27017)

    if (isPostgres) {
        envContent += `POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=${config.projectName}
DATABASE_URL="postgresql://postgres:password@localhost:${dbPort}/${config.projectName}"\n`
    } else {
        envContent += `MONGODB_URI="mongodb://localhost:${dbPort}/${config.projectName}"\n`
    }

    if (config.includeAuth) {
        envContent += `
# Authentication & Tokens
JWT_SECRET="replace-with-a-long-random-secret-at-least-32-chars"
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_TTL_SECONDS=604800
SESSION_TTL_SECONDS=2592000

# Cookies
REFRESH_COOKIE_NAME=refresh_token
REFRESH_COOKIE_SAME_SITE=lax
REFRESH_COOKIE_SECURE=false

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="${config.projectName} <no-reply@example.com>"
EMAIL_VERIFICATION_TTL_SECONDS=86400
PASSWORD_RESET_TTL_SECONDS=900
`
    }

    const envExamplePath = path.join(root, '.env.example')
    fs.writeFileSync(envExamplePath, envContent, 'utf-8')

    // Create .env as a direct clone so runtime has defaults out of the box
    const envPath = path.join(root, '.env')
    fs.writeFileSync(envPath, envContent, 'utf-8')

    // 2. Rewrite src/config/env.ts with strict, dependency-aware Zod schema
    const envTsPath = path.join(root, 'src', 'config', 'env.ts')
    let envTsCode = `import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    PORT: z.coerce.number(),
    NODE_ENV: z.enum(['development', 'test', 'production']),
    LOG_LEVEL: z.string(),
    RATE_LIMIT_WINDOW: z.coerce.number(),
    RATE_LIMIT_REQUEST: z.coerce.number(),
    DATABASE_PROVIDER: z.literal('${config.databaseProvider}'),
    CORS_ORIGINS: z
        .string()
        .min(1, 'CORS_ORIGINS is required')
        .transform((value) =>
            value
                .split(',')
                .map((origin) => origin.trim())
                .filter(Boolean),
        ),
`
    if (isPostgres) {
        envTsCode += `    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),\n`
    } else {
        envTsCode += `    MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),\n`
    }

    if (config.includeAuth) {
        envTsCode += `    API_BASE_URL: z.string().url(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().min(1, 'RESEND_FROM_EMAIL is required'),
    EMAIL_VERIFICATION_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(86400),
    PASSWORD_RESET_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(900),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(604800),
    SESSION_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(2592000),
    REFRESH_COOKIE_NAME: z.string().min(1, 'REFRESH_COOKIE_NAME is required'),
    REFRESH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
    REFRESH_COOKIE_SECURE: z
        .enum(['true', 'false'])
        .default(process.env.NODE_ENV === 'production' ? 'true' : 'false')
        .transform((value) => value === 'true'),
`
    }

    envTsCode += `})

type Env = z.infer<typeof envSchema>

const env = envSchema.parse(process.env)

export const ENV: Env = env
`
    fs.writeFileSync(envTsPath, envTsCode, 'utf-8')

    // 3. Rewrite test/setup.ts to match schema
    const testSetupPath = path.join(root, 'test', 'setup.ts')
    let testSetupCode = `/// <reference types="node" />

process.env.NODE_ENV ??= 'test'
process.env.PORT ??= '3000'
process.env.LOG_LEVEL ??= 'silent'
process.env.RATE_LIMIT_WINDOW ??= '60000'
process.env.RATE_LIMIT_REQUEST ??= '1000'
process.env.DATABASE_PROVIDER ??= '${config.databaseProvider}'
process.env.CORS_ORIGINS ??= 'http://localhost:3000'
`
    if (isPostgres) {
        testSetupCode += `process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/corestack_test'\n`
    } else {
        testSetupCode += `process.env.MONGODB_URI ??= 'mongodb://localhost:27017/corestack_test'\n`
    }

    if (config.includeAuth) {
        testSetupCode += `process.env.API_BASE_URL ??= 'http://localhost:3000'
process.env.JWT_SECRET ??= 'test-secret-that-is-long-enough-for-hmac'
process.env.JWT_EXPIRES_IN ??= '15m'
process.env.RESEND_API_KEY ??= 're_test_key'
process.env.RESEND_FROM_EMAIL ??= 'CoreStack <onboarding@resend.dev>'
process.env.REFRESH_COOKIE_NAME ??= 'refresh_token'
process.env.PASSWORD_RESET_TTL_SECONDS ??= '900'
`
    }

    fs.writeFileSync(testSetupPath, testSetupCode, 'utf-8')
}
