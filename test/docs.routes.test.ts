import request from 'supertest'
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
        expect(response.body.paths).toHaveProperty('/api/v1/auth/login')
        expect(response.body.paths).toHaveProperty('/api/v1/users')
    })

    it('serves the Scalar interactive documentation page at /docs', async () => {
        const response = await request(app).get('/docs')

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('text/html')
        expect(response.text).toContain('CoreStack API Documentation')
        // Ensure CSP header was removed so CDN assets load properly
        expect(response.headers['content-security-policy']).toBeUndefined()
    })
})
