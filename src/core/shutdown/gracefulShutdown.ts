import type { Server } from 'node:http'
import { logger } from '../logger/logger.js'

type Closable = {
    close: () => Promise<void>
}

let isShuttingDown = false

export const gracefulShutdown = async (
    server: Server,
    database: Closable,
    signal: string,
) => {
    if (isShuttingDown) {
        return
    }

    isShuttingDown = true
    logger.info(`Received ${signal}. Starting graceful shutdown...`)

    const forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timed out')
        process.exit(1)
    }, 10_000)

    forceExitTimer.unref()

    try {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error)
                    return
                }

                resolve()
            })
        })

        logger.info('HTTP server closed')
        await database.close()
        logger.info('Database connection closed')
        process.exitCode = 0
    } catch (error) {
        logger.error({ err: error }, 'Graceful shutdown failed')
        process.exitCode = 1
    } finally {
        clearTimeout(forceExitTimer)
    }
}
