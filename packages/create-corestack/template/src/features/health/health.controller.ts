import type { Request, Response } from 'express'
import { ENV } from '../../config/env.js'
import { logger } from '../../core/logger/logger.js'
import { mongoDb } from '../../mongo/db.js'
import { db } from '../../prisma/db.js'

export const health = async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
    })
}

export const readiness = async (_req: Request, res: Response) => {
    try {
        if (ENV.DATABASE_PROVIDER === 'mongodb') {
            const isConnected = await mongoDb.ping()
            if (!isConnected) {
                throw new Error('MongoDB readiness ping failed')
            }
        } else {
            await db.$queryRaw`SELECT 1`
        }

        res.status(200).json({
            status: 'ok',
            database: 'connected',
        })
    } catch (error) {
        logger.error({ err: error }, 'Readiness check failed')

        res.status(503).json({
            status: 'error',
            database: 'unavailable',
        })
    }
}
