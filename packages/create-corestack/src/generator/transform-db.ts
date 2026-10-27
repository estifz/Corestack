import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider } from '../types.js'

export async function transformDatabase(
    targetDir: string,
    database: DatabaseProvider,
): Promise<void> {
    if (database === 'postgres') {
        // Remove Mongo directory and Mongo repositories
        await fs.remove(path.join(targetDir, 'src/mongo'))
        await fs.remove(
            path.join(targetDir, 'src/features/auth/mongo-auth.repository.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'src/features/users/mongo-user.repository.ts'),
        )

        // Update auth/index.ts for Postgres
        const authIndexPath = path.join(targetDir, 'src/features/auth/index.ts')
        if (await fs.pathExists(authIndexPath)) {
            const authIndexContent = `import { PrismaAuthRepository } from './prisma-auth.repository.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'

const authRepository = new PrismaAuthRepository()
export const authService = new AuthService(authRepository)
export const authController = new AuthController(authService)
export { authRepository }
`
            await fs.writeFile(authIndexPath, authIndexContent, 'utf-8')
        }

        // Update users/index.ts for Postgres
        const userIndexPath = path.join(
            targetDir,
            'src/features/users/index.ts',
        )
        if (await fs.pathExists(userIndexPath)) {
            const userIndexContent = `import { PrismaUserRepository } from './prisma-user.repository.js'
import { UserService } from './user.service.js'
import { UserController } from './user.controller.js'

const userRepository = new PrismaUserRepository()
export const userService = new UserService(userRepository)
export const userController = new UserController(userService)
export { userRepository }
`
            await fs.writeFile(userIndexPath, userIndexContent, 'utf-8')
        }

        // Update server.ts for Postgres
        const serverPath = path.join(targetDir, 'src/server.ts')
        const serverContent = `import 'temporal-polyfill/full/global'
import app from './app.js'
import { ENV } from './config/env.js'
import { logger } from './core/logger/logger.js'
import { gracefulShutdown } from './core/shutdown/gracefulShutdown.js'
import { db } from './prisma/db.js'

const port = ENV.PORT

const server = app.listen(port, () => {
    logger.info(\`Server started listening on port \${port} [provider: postgres]\`)
})

process.once(
    'SIGTERM',
    () => void gracefulShutdown(server, db, 'SIGTERM'),
)

process.once(
    'SIGINT',
    () => void gracefulShutdown(server, db, 'SIGINT'),
)
`
        await fs.writeFile(serverPath, serverContent, 'utf-8')

        // Update health.controller.ts for Postgres
        const healthPath = path.join(
            targetDir,
            'src/features/health/health.controller.ts',
        )
        const healthContent = `import type { Request, Response } from 'express'
import { logger } from '../../core/logger/logger.js'
import { db } from '../../prisma/db.js'

export const health = async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
    })
}

export const readiness = async (_req: Request, res: Response) => {
    try {
        const query = db.raw.sql\`SELECT 1 AS result\`
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
`
        await fs.writeFile(healthPath, healthContent, 'utf-8')
    } else {
        // Database is MongoDB
        // Remove Prisma directory, migrations, config, and Prisma repositories
        await fs.remove(path.join(targetDir, 'src/prisma'))
        await fs.remove(path.join(targetDir, 'migrations'))
        await fs.remove(path.join(targetDir, 'prisma.config.ts'))
        await fs.remove(
            path.join(targetDir, 'src/features/auth/prisma-auth.repository.ts'),
        )
        await fs.remove(
            path.join(
                targetDir,
                'src/features/users/prisma-user.repository.ts',
            ),
        )
        await fs.remove(
            path.join(targetDir, 'test/prisma/readiness.integration.test.ts'),
        )

        // Update auth/index.ts for MongoDB
        const authIndexPath = path.join(targetDir, 'src/features/auth/index.ts')
        if (await fs.pathExists(authIndexPath)) {
            const authIndexContent = `import { MongoAuthRepository } from './mongo-auth.repository.js'
import { AuthService } from './auth.service.js'
import { AuthController } from './auth.controller.js'

const authRepository = new MongoAuthRepository()
export const authService = new AuthService(authRepository)
export const authController = new AuthController(authService)
export { authRepository }
`
            await fs.writeFile(authIndexPath, authIndexContent, 'utf-8')
        }

        // Update users/index.ts for MongoDB
        const userIndexPath = path.join(
            targetDir,
            'src/features/users/index.ts',
        )
        if (await fs.pathExists(userIndexPath)) {
            const userIndexContent = `import { MongoUserRepository } from './mongo-user.repository.js'
import { UserService } from './user.service.js'
import { UserController } from './user.controller.js'

const userRepository = new MongoUserRepository()
export const userService = new UserService(userRepository)
export const userController = new UserController(userService)
export { userRepository }
`
            await fs.writeFile(userIndexPath, userIndexContent, 'utf-8')
        }

        // Update server.ts for MongoDB
        const serverPath = path.join(targetDir, 'src/server.ts')
        const serverContent = `import 'temporal-polyfill/full/global'
import app from './app.js'
import { ENV } from './config/env.js'
import { logger } from './core/logger/logger.js'
import { gracefulShutdown } from './core/shutdown/gracefulShutdown.js'
import { mongoDb } from './mongo/db.js'

const port = ENV.PORT

try {
    await mongoDb.connect()
} catch (error) {
    logger.error({ err: error }, 'Failed to initialize database on startup')
    process.exit(1)
}

const server = app.listen(port, () => {
    logger.info(\`Server started listening on port \${port} [provider: mongodb]\`)
})

process.once(
    'SIGTERM',
    () => void gracefulShutdown(server, mongoDb, 'SIGTERM'),
)

process.once(
    'SIGINT',
    () => void gracefulShutdown(server, mongoDb, 'SIGINT'),
)
`
        await fs.writeFile(serverPath, serverContent, 'utf-8')

        // Update health.controller.ts for MongoDB
        const healthPath = path.join(
            targetDir,
            'src/features/health/health.controller.ts',
        )
        const healthContent = `import type { Request, Response } from 'express'
import { logger } from '../../core/logger/logger.js'
import { mongoDb } from '../../mongo/db.js'

export const health = async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
    })
}

export const readiness = async (_req: Request, res: Response) => {
    try {
        const isConnected = await mongoDb.ping()
        if (!isConnected) {
            throw new Error('MongoDB readiness ping failed')
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
`
        await fs.writeFile(healthPath, healthContent, 'utf-8')
    }
}
