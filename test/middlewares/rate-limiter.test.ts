import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'

describe('rate limiter', () => {
    it('returns the standard rate-limit error after the configured request limit', async () => {
        process.env.RATE_LIMIT_REQUEST = '2'
        const { limiter } = await import('../../src/middlewares/rateLimiter.js')
        const { errorHandler } =
            await import('../../src/middlewares/errorHandler.js')
        const app = express()
        app.use(limiter)
        app.get('/', (_req, res) => res.sendStatus(200))
        app.use(errorHandler)

        expect((await request(app).get('/')).status).toBe(200)
        expect((await request(app).get('/')).status).toBe(200)
        const limited = await request(app).get('/')

        expect(limited.status).toBe(429)
        expect(limited.body.code).toBe('RATE_LIMIT_EXCEEDED')
    })
})
