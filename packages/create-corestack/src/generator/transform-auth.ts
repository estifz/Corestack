import path from 'node:path'
import fs from 'fs-extra'

export async function transformAuth(
    targetDir: string,
    auth: boolean,
): Promise<void> {
    if (auth) {
        return
    }

    // Auth is FALSE: Prune auth features and modules
    await fs.remove(path.join(targetDir, 'src/features/auth'))
    await fs.remove(path.join(targetDir, 'src/features/users'))
    await fs.remove(path.join(targetDir, 'src/infrastructure'))
    await fs.remove(path.join(targetDir, 'src/middlewares/auth.middleware.ts'))
    await fs.remove(
        path.join(targetDir, 'src/middlewares/requireTrustedOrigin.ts'),
    )
    await fs.remove(path.join(targetDir, 'src/utils/jwt.ts'))
    await fs.remove(path.join(targetDir, 'src/utils/token.ts'))

    // If MongoDB exists, clean up auth models
    const mongoModelsDir = path.join(targetDir, 'src/mongo/models')
    if (await fs.pathExists(mongoModelsDir)) {
        await fs.emptyDir(mongoModelsDir)
        await fs.writeFile(
            path.join(mongoModelsDir, 'index.ts'),
            '// MongoDB models\nexport {}\n',
            'utf-8',
        )
    }

    // Clean up OpenAPI specification if present
    const openapiPath = path.join(targetDir, 'src/docs/openapi.ts')
    if (await fs.pathExists(openapiPath)) {
        const minimalOpenApi = `export const openapiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'CoreStack API',
        version: '1.0.0',
        description: 'A production-oriented TypeScript backend foundation built for maintainability, consistency, and long-term reuse.',
    },
    servers: [
        {
            url: '/',
            description: 'Current Environment Server',
        },
    ],
    tags: [
        {
            name: 'System',
            description: 'Health, liveness, and database readiness checks',
        },
    ],
    paths: {
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Liveness check',
                description: 'Verifies the HTTP process is running without querying the database.',
                responses: {
                    '200': {
                        description: 'Process is alive',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        '/ready': {
            get: {
                tags: ['System'],
                summary: 'Readiness check',
                description: 'Verifies the database connection is live and active.',
                responses: {
                    '200': {
                        description: 'Service is ready',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'ok' },
                                        database: { type: 'string', example: 'connected' },
                                    },
                                },
                            },
                        },
                    },
                    '503': {
                        description: 'Service unavailable',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string', example: 'error' },
                                        database: { type: 'string', example: 'unavailable' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
}
`
        await fs.writeFile(openapiPath, minimalOpenApi, 'utf-8')
    }
}
