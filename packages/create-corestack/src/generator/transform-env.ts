import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider } from '../types.js'

export async function transformEnv(
    targetDir: string,
    options: { database: DatabaseProvider; auth: boolean },
): Promise<void> {
    const { database, auth } = options

    // 1. Generate src/config/env.ts
    const envTsPath = path.join(targetDir, 'src/config/env.ts')

    let dbSchemaField = ''
    if (database === 'postgres') {
        dbSchemaField = `        DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),`
    } else {
        dbSchemaField = `        MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),`
    }

    let authSchemaFields = ''
    let cookieChecks = ''
    if (auth) {
        authSchemaFields = `
        RESEND_API_KEY: z.string().optional(),
        RESEND_FROM_EMAIL: z.string().min(1).default('onboarding@resend.dev'),
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
        REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
        REFRESH_COOKIE_SAME_SITE: z
            .enum(['strict', 'lax', 'none'])
            .default('lax'),
        REFRESH_COOKIE_SECURE: z
            .enum(['true', 'false'])
            .default(process.env.NODE_ENV === 'production' ? 'true' : 'false')
            .transform((value) => value === 'true'),`

        cookieChecks = `
if (env.REFRESH_COOKIE_SAME_SITE === 'none' && !env.REFRESH_COOKIE_SECURE) {
    throw new Error('REFRESH_COOKIE_SECURE must be true when SameSite=None')
}
if (env.NODE_ENV === 'production' && !env.REFRESH_COOKIE_SECURE) {
    throw new Error('REFRESH_COOKIE_SECURE must be true in production')
}
`
    }

    const envTsContent = `import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
        PORT: z.coerce.number().default(3000),
        NODE_ENV: z
            .enum(['development', 'test', 'production'])
            .default('development'),
        LOG_LEVEL: z.string().default('info'),
        RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
        RATE_LIMIT_REQUEST: z.coerce.number().default(100),
${dbSchemaField}
        API_BASE_URL: z.string().url().default('http://localhost:3000'),${authSchemaFields}
        CORS_ORIGINS: z
            .string()
            .default('http://localhost:3000')
            .transform((value) =>
                value
                    .split(',')
                    .map((origin) => origin.trim())
                    .filter(Boolean),
            ),
    })

type Env = z.infer<typeof envSchema>

const env = envSchema.parse(process.env)
${cookieChecks}
export const ENV: Env = env
`
    await fs.writeFile(envTsPath, envTsContent, 'utf-8')

    // 2. Generate .env.example
    const envExamplePath = path.join(targetDir, '.env.example')
    const envSections: string[] = [
        `# Server & Runtime
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
API_BASE_URL=http://localhost:3000

# Security & CORS
CORS_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_REQUEST=100`,
    ]

    if (database === 'postgres') {
        envSections.push(`# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/corestack"`)
    } else {
        envSections.push(`# Database
MONGODB_URI="mongodb://localhost:27017/corestack"`)
    }

    if (auth) {
        envSections.push(`# Authentication & Tokens
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
RESEND_FROM_EMAIL="CoreStack <no-reply@example.com>"
EMAIL_VERIFICATION_TTL_SECONDS=86400
PASSWORD_RESET_TTL_SECONDS=900`)
    }

    const envContent = envSections.join('\n\n') + '\n'
    await fs.writeFile(envExamplePath, envContent, 'utf-8')

    // 3. Write initial .env file so the app can start out of the box
    const initialEnvPath = path.join(targetDir, '.env')
    await fs.writeFile(initialEnvPath, envContent, 'utf-8')
}
