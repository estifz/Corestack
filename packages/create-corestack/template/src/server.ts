import 'temporal-polyfill/full/global'
import app from './app.js'
import { ENV } from './config/env.js'
import { logger } from './core/logger/logger.js'
import { gracefulShutdown } from './core/shutdown/gracefulShutdown.js'
import { mongoDb } from './mongo/db.js'
import { db } from './prisma/db.js'

const port = ENV.PORT

const activeDatabase = ENV.DATABASE_PROVIDER === 'mongodb' ? mongoDb : db

if (ENV.DATABASE_PROVIDER === 'mongodb') {
    try {
        await mongoDb.connect()
    } catch (error) {
        logger.error({ err: error }, 'Failed to initialize database on startup')
        process.exit(1)
    }
}

const server = app.listen(port, () => {
    logger.info(
        `Server started listening on port ${port} [provider: ${ENV.DATABASE_PROVIDER}]`,
    )
})

process.once(
    'SIGTERM',
    () => void gracefulShutdown(server, activeDatabase, 'SIGTERM'),
)

process.once(
    'SIGINT',
    () => void gracefulShutdown(server, activeDatabase, 'SIGINT'),
)
