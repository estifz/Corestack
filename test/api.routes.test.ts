import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('HTTP API', () => {
    it('serves health without database access', async () => {
        const response = await request(app).get('/health')
        expect(response.status).toBe(200)
        expect(response.body).toEqual({ status: 'ok' })
    })

    it('validates registration input before reaching persistence', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({ email: 'bad-email', password: 'short' })
        expect(response.status).toBe(400)
        expect(response.body.code).toBe('VALIDATION_ERROR')
    })

    it('protects the current-user endpoint', async () => {
        const response = await request(app).get('/api/v1/auth/me')
        expect(response.status).toBe(401)
    })

    it('validates password reset payload before reaching persistence', async () => {
        const response = await request(app)
            .post('/api/v1/auth/reset-password')
            .send({ token: 'short', password: 'short' })
        expect(response.status).toBe(400)
        expect(response.body.code).toBe('VALIDATION_ERROR')
    })
})
