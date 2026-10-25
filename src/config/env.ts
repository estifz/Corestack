import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    PORT: z.coerce.number(),
    NODE_ENV: z
        .enum(['development', 'test', 'production'])
        .default('development'),
    LOG_LEVEL: z.string(),
    RATE_LIMIT_WINDOW: z.coerce.number(),
    RATE_LIMIT_REQUEST: z.coerce.number(),
    DATABASE_PROVIDER: z.enum(['postgres', 'mongodb']).default('postgres'),
    DATABASE_URL: z.string(),
    MONGODB_URI: z.string(),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().min(1).default('onboarding@resend.dev'),
    API_BASE_URL: z.string().url().default('http://localhost:3000'),
    EMAIL_VERIFICATION_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(86400),
    PASSWORD_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(604800),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
    REFRESH_COOKIE_NAME: z.string().min(1).default('refresh_token'),
    REFRESH_COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
    REFRESH_COOKIE_SECURE: z
        .enum(['true', 'false'])
        .default(process.env.NODE_ENV === 'production' ? 'true' : 'false')
        .transform((value) => value === 'true'),
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

if (env.REFRESH_COOKIE_SAME_SITE === 'none' && !env.REFRESH_COOKIE_SECURE) {
    throw new Error('REFRESH_COOKIE_SECURE must be true when SameSite=None')
}
if (env.NODE_ENV === 'production' && !env.REFRESH_COOKIE_SECURE) {
    throw new Error('REFRESH_COOKIE_SECURE must be true in production')
}

export const ENV: Env = env
