import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from '../types.js'
import { DEPENDENCY_MAP } from './dependency-map.js'

export function transformAuth(config: ProjectConfig): void {
    if (config.includeAuth) {
        return
    }

    const root = config.projectPath

    // 1. Delete all auth & user files
    for (const relPath of DEPENDENCY_MAP.auth.filesToDelete) {
        const fullPath = path.join(root, relPath)
        if (fs.existsSync(fullPath)) {
            fs.rmSync(fullPath, { recursive: true, force: true })
        }
    }

    // 2. Remove temporal polyfill from src/server.ts if present
    const serverFile = path.join(root, 'src', 'server.ts')
    if (fs.existsSync(serverFile)) {
        let serverCode = fs.readFileSync(serverFile, 'utf-8')
        serverCode = serverCode.replace(
            "import 'temporal-polyfill/full/global'\n",
            '',
        )
        fs.writeFileSync(serverFile, serverCode, 'utf-8')
    }

    // 3. Clean src/app.ts (remove auth/user imports and route mounts)
    const appFile = path.join(root, 'src', 'app.ts')
    if (fs.existsSync(appFile)) {
        let appCode = fs.readFileSync(appFile, 'utf-8')
        appCode = appCode
            .replace(
                "import userRoutes from './features/users/user.route.js'\n",
                '',
            )
            .replace(
                "import authRoutes from './features/auth/auth.route.js'\n",
                '',
            )
            .replace("app.use('/api/v1/auth', authRoutes)\n", '')
            .replace("app.use('/api/v1/users', userRoutes)\n", '')
        fs.writeFileSync(appFile, appCode, 'utf-8')
    }

    // 4. Clean database schemas/models
    if (config.databaseProvider === 'postgres') {
        const schemaFile = path.join(root, 'prisma', 'schema.prisma')
        if (fs.existsSync(schemaFile)) {
            const cleanSchema = `datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

// Add your custom models below:
// model Item {
//   id        String   @id @default(uuid())
//   title     String
//   createdAt DateTime @default(now()) @map("created_at")
//   updatedAt DateTime @updatedAt @map("updated_at")
// }
`
            fs.writeFileSync(schemaFile, cleanSchema, 'utf-8')
        }
        // Remove auth migration history since models are gone
        const migrationsDir = path.join(root, 'prisma', 'migrations')
        if (fs.existsSync(migrationsDir)) {
            fs.rmSync(migrationsDir, { recursive: true, force: true })
        }
    } else {
        const modelsDir = path.join(root, 'src', 'mongo', 'models')
        if (fs.existsSync(modelsDir)) {
            fs.rmSync(modelsDir, { recursive: true, force: true })
            fs.mkdirSync(modelsDir, { recursive: true })
            fs.writeFileSync(
                path.join(modelsDir, 'index.ts'),
                '// Export your Mongoose models here\nexport {}\n',
                'utf-8',
            )
        }
    }

    // 5. Simplify test/api.routes.test.ts (keep health and 404 tests only)
    const apiTestFile = path.join(root, 'test', 'api.routes.test.ts')
    if (fs.existsSync(apiTestFile)) {
        const cleanApiTest = `import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('HTTP API', () => {
    it('serves health without database access', async () => {
        const response = await request(app).get('/health')
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'ok' })
    })

    it('returns 404 for unknown endpoints', async () => {
        const response = await request(app).get('/api/v1/unknown-endpoint')
        expect(response.status).toBe(404)
        expect(response.body.code).toBe('NOT_FOUND')
    })
})
`
        fs.writeFileSync(apiTestFile, cleanApiTest, 'utf-8')
    }

    // 6. If Docs are enabled, tailor openapi.ts to only System endpoints
    if (config.includeDocs) {
        // 6. If Docs are enabled, tailor openapi.ts to only System endpoints and update test
        const openapiFile = path.join(root, 'src', 'docs', 'openapi.ts')
        if (fs.existsSync(openapiFile)) {
            const cleanOpenapi = `export const openapiSpec = {
    openapi: '3.1.0',
    info: {
        title: 'CoreStack API',
        version: '1.0.0',
        description: 'A production-oriented TypeScript backend built with CoreStack.',
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
    components: {
        schemas: {
            ErrorResponse: {
                type: 'object',
                properties: {
                    error: {
                        type: 'object',
                        properties: {
                            code: { type: 'string' },
                            message: { type: 'string' },
                        },
                    },
                },
            },
        },
    },
    paths: {
        '/': {
            get: {
                tags: ['System'],
                summary: 'Service info',
                responses: {
                    '200': { description: 'Service status' },
                },
            },
        },
        '/health': {
            get: {
                tags: ['System'],
                summary: 'Liveness check',
                responses: {
                    '200': { description: 'Service is healthy' },
                },
            },
        },
        '/ready': {
            get: {
                tags: ['System'],
                summary: 'Database readiness check',
                responses: {
                    '200': { description: 'Database is connected' },
                    '503': { description: 'Database is unavailable' },
                },
            },
        },
    },
}
`
            fs.writeFileSync(openapiFile, cleanOpenapi, 'utf-8')
        }

        const docsTestFile = path.join(root, 'test', 'docs.routes.test.ts')
        if (fs.existsSync(docsTestFile)) {
            const cleanDocsTest = `import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('API Documentation Routes', () => {
    it('serves the OpenAPI 3.1 specification at /openapi.json', async () => {
        const response = await request(app).get('/openapi.json')

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('application/json')
        expect(response.body.openapi).toBe('3.1.0')
        expect(response.body.info.title).toBe('CoreStack API')
        expect(response.body.paths).toHaveProperty('/health')
    })

    it('serves the Scalar interactive documentation page at /docs', async () => {
        const response = await request(app).get('/docs')

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('text/html')
        expect(response.text).toContain('CoreStack API Documentation')
        expect(response.headers['content-security-policy']).toBeUndefined()
    })
})
`
            fs.writeFileSync(docsTestFile, cleanDocsTest, 'utf-8')
        }
    }
}
