import express from 'express'
import { apiReference } from '@scalar/express-api-reference'
import { openapiSpec } from './openapi.js'

const router = express.Router()

router.get('/openapi.json', (_req, res) => {
    res.status(200).json(openapiSpec)
})

router.use(
    '/docs',
    (_req, res, next) => {
        res.removeHeader('Content-Security-Policy')
        next()
    },
    apiReference({
        spec: {
            content: openapiSpec,
        },
        pageTitle: 'CoreStack API Documentation',
    }),
)

export default router
