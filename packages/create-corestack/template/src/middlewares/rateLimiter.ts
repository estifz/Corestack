import { rateLimit } from 'express-rate-limit'
import { RateLimitError } from '../utils/errors/appError.js'
import { ENV } from '../config/env.js'

export const limiter = rateLimit({
    windowMs: ENV.RATE_LIMIT_WINDOW,
    limit: ENV.RATE_LIMIT_REQUEST,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    ipv6Subnet: 56,
    handler: (_req, _res, _next) => {
        throw new RateLimitError()
    },
})
