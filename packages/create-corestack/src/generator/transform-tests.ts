import path from 'node:path'
import fs from 'fs-extra'
import type { DatabaseProvider } from '../types.js'

export async function transformTests(
    targetDir: string,
    options: {
        database: DatabaseProvider
        auth: boolean
        docs: boolean
    },
): Promise<void> {
    const { database, auth, docs } = options

    if (database === 'mongodb') {
        await fs.remove(
            path.join(targetDir, 'test/prisma/readiness.integration.test.ts'),
        )
    }

    if (!docs) {
        await fs.remove(path.join(targetDir, 'test/docs.routes.test.ts'))
    }

    if (!auth) {
        await fs.remove(
            path.join(targetDir, 'test/features/auth.service.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/features/auth.validation.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/features/auth.tokens.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/features/password-reset.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/features/user.service.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/middlewares/auth.middleware.test.ts'),
        )
        await fs.remove(
            path.join(targetDir, 'test/middlewares/trusted-origin.test.ts'),
        )
        await fs.remove(path.join(targetDir, 'test/utils/jwt.test.ts'))

        // If docs is enabled but auth is disabled, adjust docs.routes.test.ts
        if (docs) {
            const docsTestPath = path.join(
                targetDir,
                'test/docs.routes.test.ts',
            )
            if (await fs.pathExists(docsTestPath)) {
                const docsTestContent = `import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('API Documentation Routes', () => {
    it('serves the OpenAPI 3.1 specification at /openapi.json', async () => {
        const response = await request(app).get('/openapi.json')
        expect(response.status).toBe(200)
        expect(response.body.openapi).toBe('3.1.0')
        expect(response.body.info.title).toBe('CoreStack API')
        expect(response.body.paths).toHaveProperty('/health')
    })

    it('serves the Scalar interactive documentation page at /docs', async () => {
        const response = await request(app).get('/docs')
        expect(response.status).toBe(200)
        expect(response.text).toContain('<!doctype html>')
    })
})
`
                await fs.writeFile(docsTestPath, docsTestContent, 'utf-8')
            }
        }

        // Update api.routes.test.ts to only test health and 404
        const apiRoutesTestPath = path.join(
            targetDir,
            'test/api.routes.test.ts',
        )
        const minimalApiTest = `import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('HTTP API', () => {
    it('serves health without database access', async () => {
        const response = await request(app).get('/health')
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'ok' })
    })

    it('returns a structured JSON error when route is not found', async () => {
        const response = await request(app).get('/api/v1/unknown-endpoint')
        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            code: 'NOT_FOUND',
            message: 'Route not found',
        })
    })
})
`
        await fs.writeFile(apiRoutesTestPath, minimalApiTest, 'utf-8')
    }
}
