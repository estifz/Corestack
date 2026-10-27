import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import {
    authenticate,
    authorize,
} from '../../src/middlewares/auth.middleware.js'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { signAccessToken } from '../../src/utils/jwt.js'

function createApp() {
    const app = express()
    app.get('/protected', authenticate, authorize('ADMIN'), (req, res) => {
        res.json({ user: req.user })
    })
    app.use(errorHandler)
    return app
}

describe('authentication and role middleware', () => {
    it('rejects a missing bearer token', async () => {
        const response = await request(createApp()).get('/protected')
        expect(response.status).toBe(401)
    })

    it('rejects an invalid bearer token', async () => {
        const response = await request(createApp())
            .get('/protected')
            .set('Authorization', 'Bearer invalid')
        expect(response.status).toBe(401)
    })

    it('rejects a user without the required role', async () => {
        const token = await signAccessToken({ userId: 'user-1', role: 'USER' })
        const response = await request(createApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`)
        expect(response.status).toBe(403)
    })

    it('attaches the verified identity and allows the required role', async () => {
        const token = await signAccessToken({
            userId: 'admin-1',
            role: 'ADMIN',
        })
        const response = await request(createApp())
            .get('/protected')
            .set('Authorization', `Bearer ${token}`)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            user: { id: 'admin-1', role: 'ADMIN' },
        })
    })
})
