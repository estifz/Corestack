import app from './app.js'
import { ENV } from './config/env.js'
import { logger } from './core/logger/logger.js'
import { gracefulShutdown } from './core/shutdown/gracefulShutdown.js'
import { db } from './prisma/db.js'

const port = ENV.PORT

const server = app.listen(port, () => {
    logger.info('Server started listening')
})

process.once('SIGTERM', () => void gracefulShutdown(server, db, 'SIGTERM'))

process.once('SIGINT', () => void gracefulShutdown(server, db, 'SIGINT'))
