import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { DEPENDENCY_MAP } from './dependency-map.js'

export function transformDatabase(config: ProjectConfig): void {
    const root = config.projectPath
    const isPostgres = config.databaseProvider === 'postgres'

    // 1. Delete unselected database files
    const unselected = isPostgres
        ? DEPENDENCY_MAP.postgres.filesToDelete
        : DEPENDENCY_MAP.mongodb.filesToDelete
    for (const relPath of unselected) {
        const fullPath = path.join(root, relPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true })
        }
    }

    // 2. Rewrite src/server.ts for concrete DB connection
    const serverFile = path.join(root, 'src', 'server.ts')
    if (fs.existsSync(serverFile)) {
        let serverCode = fs.readFileSync(serverFile, 'utf-8')

        if (isPostgres) {
            serverCode = `import 'temporal-polyfill/full/global'
import app from './app.js'
import { ENV } from './config/env.js'
import { logger } from './core/logger/logger.js'
import { gracefulShutdown } from './core/shutdown/gracefulShutdown.js'
import { db } from './prisma/db.js'

const port = ENV.PORT

const server = app.listen(port, () => {
    logger.info(\`Server started listening on port \${port} [provider: postgres]\`)
})

process.once('SIGTERM', () => void gracefulShutdown(server, db, 'SIGTERM'))
process.once('SIGINT', () => void gracefulShutdown(server, db, 'SIGINT'))
`
        } else {
            serverCode = `import 'temporal-polyfill/full/global'
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

process.once('SIGTERM', () => void gracefulShutdown(server, mongoDb, 'SIGTERM'))
process.once('SIGINT', () => void gracefulShutdown(server, mongoDb, 'SIGINT'))
`
        }

        fs.writeFileSync(serverFile, serverCode, 'utf-8')
    }

    // 3. Rewrite src/features/health/health.controller.ts
    const healthControllerFile = path.join(
        root,
        'src',
        'features',
        'health',
        'health.controller.ts',
    )
    if (fs.existsSync(healthControllerFile)) {
        let healthCode = ''
        if (isPostgres) {
            healthCode = `import type { Request, Response } from 'express'
import { logger } from '../../core/logger/logger.js'
import { db } from '../../prisma/db.js'

export const health = async (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'ok',
    })
}

export const readiness = async (_req: Request, res: Response) => {
    try {
        await db.$queryRaw\`SELECT 1\`
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
        } else {
            healthCode = `import type { Request, Response } from 'express'
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
        }

        fs.writeFileSync(healthControllerFile, healthCode, 'utf-8')
    }

    // 4. If Auth is kept, bind repositories concretely without conditional ternary
    if (config.includeAuth) {
        const authIndex = path.join(root, 'src', 'features', 'auth', 'index.ts')
        if (fs.existsSync(authIndex)) {
            const authRepoImport = isPostgres
                ? "import { PrismaAuthRepository } from './prisma-auth.repository.js'"
                : "import { MongoAuthRepository } from './mongo-auth.repository.js'"
            const repoClass = isPostgres
                ? 'PrismaAuthRepository'
                : 'MongoAuthRepository'

            const code = `import { AuthController } from './auth.controller.js'
${authRepoImport}
import { AuthService } from './auth.service.js'
import type { AuthRepository } from './auth.repository.js'

const repository: AuthRepository = new ${repoClass}()
const service = new AuthService(repository)

export const authController = new AuthController(service)
`
            fs.writeFileSync(authIndex, code, 'utf-8')
        }

        const userIndex = path.join(
            root,
            'src',
            'features',
            'users',
            'index.ts',
        )
        if (fs.existsSync(userIndex)) {
            const userRepoImport = isPostgres
                ? "import { PrismaUserRepository } from './prisma-user.repository.js'"
                : "import { MongoUserRepository } from './mongo-user.repository.js'"
            const repoClass = isPostgres
                ? 'PrismaUserRepository'
                : 'MongoUserRepository'

            const code = `import { UserController } from './user.controller.js'
${userRepoImport}
import { UserService } from './user.service.js'
import type { UserRepository } from './user.repository.js'

const repository: UserRepository = new ${repoClass}()
const service = new UserService(repository)

export const userController = new UserController(service)
`
            fs.writeFileSync(userIndex, code, 'utf-8')
        }
    }

    // 5. Update database readiness check and target user ID in docs/requests.http
    const requestsHttpFile = path.join(root, 'docs', 'requests.http')
    if (fs.existsSync(requestsHttpFile) && !isPostgres) {
        let content = fs.readFileSync(requestsHttpFile, 'utf-8')
        content = content
            .replace('PostgreSQL Readiness Check', 'MongoDB Readiness Check')
            .replace(
                '@targetUserId = your_user_uuid_here',
                '@targetUserId = your_user_id_here',
            )
        fs.writeFileSync(requestsHttpFile, content, 'utf-8')
    }

    // 6. Tailor OpenAPI documentation for MongoDB
    const openapiFile = path.join(root, 'src', 'docs', 'openapi.ts')
    if (fs.existsSync(openapiFile) && !isPostgres) {
        let content = fs.readFileSync(openapiFile, 'utf-8')
        content = content
            .replace(
                'PostgreSQL database readiness check',
                'MongoDB database readiness check',
            )
            .replace(
                'Executes a lightweight query against PostgreSQL to ensure the persistence layer is healthy.',
                'Performs a ping command against MongoDB to ensure the persistence layer is healthy.',
            )
            .replace(
                'PostgreSQL is connected and ready',
                'MongoDB is connected and ready',
            )
            .replace('PostgreSQL is unavailable', 'MongoDB is unavailable')
            .replace(
                "description: 'Target user UUID'",
                "description: 'Target user ObjectId'",
            )
            .replaceAll("format: 'uuid'", () => "pattern: '^[0-9a-fA-F]{24}$'")
            .replaceAll(
                "example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'",
                "example: '507f1f77bcf86cd799439011'",
            )
        fs.writeFileSync(openapiFile, content, 'utf-8')
    }
}
