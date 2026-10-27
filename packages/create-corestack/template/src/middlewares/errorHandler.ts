import type { ErrorRequestHandler } from 'express'
import { AppError } from '../utils/errors/appError.js'
import z from 'zod'
import { logger } from '../core/logger/logger.js'
import { isJsonParseError } from '../types/isJsonParserError.js'

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof AppError) {
        logger.warn({ err: error }, error.message)
        return res.status(error.statusCode).json({
            success: false,
            code: error.code,
            message: error.message,
        })
    }

    if (error instanceof z.ZodError) {
        logger.warn({ err: error }, 'Request validation failed')
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
        })
    }

    if (isJsonParseError(error)) {
        logger.warn({ err: error }, 'Invalid JSON format')

        return res.status(400).json({
            success: false,
            code: 'BAD_REQUEST',
            message: 'Invalid JSON format',
        })
    }

    logger.error({ err: error }, 'Unhandled server error')

    return res.status(500).json({
        success: false,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
    })
}
