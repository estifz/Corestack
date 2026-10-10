import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
    PORT: z.coerce.number(),
    LOG_LEVEL: z.string(),
    RATE_LIMIT_WINDOW: z.coerce.number(),
    RATE_LIMIT_REQUEST: z.coerce.number(),
    DATABASE_URL: z.string(),
})

type Env = z.infer<typeof envSchema>

export const ENV: Env = envSchema.parse(process.env)
