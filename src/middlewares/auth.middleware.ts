import type { RequestHandler } from 'express'
import { verifyAccessToken, type UserRole } from '../utils/jwt.js'
import { ForbiddenError, UnauthorizedError } from '../utils/errors/appError.js'

/**
 * Express middleware to authenticate requests via Bearer access token.
 * Extracts token from Authorization header, verifies it, and attaches `req.user`.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Authentication token is required')
        }

        const token = authHeader.substring(7).trim()
        if (!token) {
            throw new UnauthorizedError('Authentication token is required')
        }

        const payload = await verifyAccessToken(token)
        req.user = {
            id: payload.sub,
            role: payload.role,
            isEmailVerified: Boolean(payload.isEmailVerified),
        }

        next()
    } catch (error) {
        next(error)
    }
}

/**
 * Express middleware to ensure the authenticated user has a verified email address.
 * Use on sensitive routes that require verified identity.
 */
export const requireVerifiedEmail: RequestHandler = (req, _res, next) => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication is required'))
    }

    if (!req.user.isEmailVerified) {
        return next(
            new ForbiddenError(
                'Email verification is required to perform this action',
            ),
        )
    }

    next()
}

/**
 * Express middleware to enforce role-based access control.
 * Ensures the authenticated user has one of the allowed roles.
 */
export function authorize(...allowedRoles: UserRole[]): RequestHandler {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication is required'))
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                new ForbiddenError(
                    'You do not have permission to perform this action',
                ),
            )
        }

        next()
    }
}
