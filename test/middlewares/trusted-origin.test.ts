import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { requireTrustedOrigin } from '../../src/middlewares/requireTrustedOrigin.js'

function createApp() {
    const app = express()
    app.post('/refresh', requireTrustedOrigin, (_req, res) =>
        res.sendStatus(204),
    )
    app.use(errorHandler)
    return app
}

describe('trusted-origin middleware', () => {
    it('allows configured origins', async () => {
        const response = await request(createApp())
            .post('/refresh')
            .set('Origin', 'http://localhost:3000')
        expect(response.status).toBe(204)
    })

    it.each([undefined, 'https://untrusted.example'])(
        'rejects missing or untrusted origins (%s)',
        async (origin) => {
            let call = request(createApp()).post('/refresh')
            if (origin) call = call.set('Origin', origin)
            const response = await call
            expect(response.status).toBe(403)
        },
    )
})
