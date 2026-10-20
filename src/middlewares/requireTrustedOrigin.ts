import type { RequestHandler } from 'express'
import { ENV } from '../config/env.js'
import { ForbiddenError } from '../utils/errors/appError.js'

export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
    const origin = req.get('origin')
    if (!origin || !ENV.CORS_ORIGINS.includes(origin)) {
        return next(new ForbiddenError('Untrusted request origin'))
    }
    next()
}
