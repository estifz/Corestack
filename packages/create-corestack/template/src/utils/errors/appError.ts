import type { ErrorCode } from '../../types/error-codes.js'

export class AppError extends Error {
    statusCode: number
    code: string

    constructor(code: ErrorCode, message: string, statusCode: number) {
        super(message)
        this.statusCode = statusCode
        this.code = code
    }
}

export class BadRequestError extends AppError {
    constructor(message: string = 'The request body or syntax is malformed') {
        super('BAD_REQUEST' as ErrorCode, message, 400)
    }
}

export class ValidationError extends AppError {
    constructor(
        message: string = 'Validation failed for the requested payload',
    ) {
        super('VALIDATION_FAILED' as ErrorCode, message, 400)
    }
}

export class UnauthorizedError extends AppError {
    constructor(
        message: string = 'Authentication is required to access this resource',
    ) {
        super('UNAUTHORIZED', message, 401)
    }
}

export class ForbiddenError extends AppError {
    constructor(
        message: string = 'You do not have permission to perform this action',
    ) {
        super('FORBIDDEN', message, 403)
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'The requested resource could not be found') {
        super('NOT_FOUND', message, 404)
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests. Please try again later') {
        super('RATE_LIMIT_EXCEEDED', message, 429)
    }
}

export class ConflictError extends AppError {
    constructor(
        message: string = 'A conflict occurred with the current state of the resource',
    ) {
        super('RESOURCE_ALREADY_EXISTS', message, 409)
    }
}
