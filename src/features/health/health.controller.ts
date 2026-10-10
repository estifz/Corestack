import type { Request, Response } from 'express'
import { logger } from '../../core/logger/logger.js'
import { db } from '../../prisma/db.js'

export const health = async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
    })
}

export const readiness = async (_req: Request, res: Response) => {
    try {
        const query = db.raw.sql`SELECT 1 AS result`
            .returnsRow({ result: 'pg/int4@1' })
            .build()

        await db.runtime().query(query)

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
