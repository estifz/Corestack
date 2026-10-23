import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { NotFoundError } from '../../src/utils/errors/appError.js'

describe('error handler', () => {
    it('returns the public shape for application errors', async () => {
        const app = express()
        app.get('/', () => {
            throw new NotFoundError('Missing')
        })
        app.use(errorHandler)
        const response = await request(app).get('/')

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            success: false,
            code: 'NOT_FOUND',
            message: 'Missing',
        })
    })

    it('returns a validation response for malformed JSON', async () => {
        const app = express()
        app.use(express.json())
        app.post('/', (_req, res) => res.sendStatus(204))
        app.use(errorHandler)
        const response = await request(app)
            .post('/')
            .set('Content-Type', 'application/json')
            .send('{')

        expect(response.status).toBe(400)
        expect(response.body.code).toBe('BAD_REQUEST')
    })

    it('does not leak unexpected error details', async () => {
        const app = express()
        app.get('/', () => {
            throw new Error('internal database secret')
        })
        app.use(errorHandler)
        const response = await request(app).get('/')

        expect(response.status).toBe(500)
        expect(response.body.message).toBe('Internal server error')
        expect(JSON.stringify(response.body)).not.toContain(
            'internal database secret',
        )
    })
})
