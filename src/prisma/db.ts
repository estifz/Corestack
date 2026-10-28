import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { ENV } from '../config/env.js'

declare global {
    var __prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL })
    return new PrismaClient({
        adapter,
        log: ENV.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    })
}

export const prisma = globalThis.__prisma ?? createPrismaClient()

if (ENV.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma
}

export const db = Object.assign(prisma, {
    close: () => prisma.$disconnect(),
})

export default prisma
